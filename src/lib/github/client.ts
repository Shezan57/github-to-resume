/**
 * GitHub API Client
 * 
 * Handles all GitHub API interactions with:
 * - Rate limit tracking and recovery
 * - Conditional requests with ETags
 * - Automatic retry with exponential backoff
 * - Content fetching with size limits
 */

import { Octokit } from '@octokit/rest';
import {
    GitHubUser,
    GitHubRepository,
    GitHubLanguages,
    ProcessedRepository,
    ProcessedUser,
    RepositoryContent
} from '@/types/github';
import { retry, sleep } from '../utils';
import {
    truncateToTokenLimit,
    ContentBudget
} from '../tokens';

// Configuration
const MAX_REPOS_TO_ANALYZE = 20;
const MAX_FILE_SIZE_BYTES = 100 * 1024; // 100KB
const MAX_SOURCE_FILES_PER_REPO = 5;
const RATE_LIMIT_BUFFER = 10; // Keep 10 requests in reserve

// File patterns for analysis
const CONFIG_FILES = [
    'package.json',
    'requirements.txt',
    'Pipfile',
    'pyproject.toml',
    'Cargo.toml',
    'go.mod',
    'pom.xml',
    'build.gradle',
    'Gemfile',
    'composer.json',
    'Dockerfile',
    'docker-compose.yml',
    'docker-compose.yaml',
    '.env.example',
];

const SOURCE_EXTENSIONS = [
    '.ts', '.tsx', '.js', '.jsx',
    '.py',
    '.go',
    '.rs',
    '.java', '.kt',
    '.rb',
    '.php',
    '.c', '.cpp', '.h', '.hpp',
    '.cs',
    '.swift',
];

const IGNORE_PATTERNS = [
    'node_modules',
    'vendor',
    'dist',
    'build',
    '.git',
    '__pycache__',
    '.next',
    'coverage',
    '.cache',
];

interface RateLimitInfo {
    remaining: number;
    reset: Date;
    limit: number;
}

export class GitHubClient {
    private octokit: Octokit;
    private rateLimit: RateLimitInfo | null = null;
    private onProgress?: (message: string) => void;

    constructor(token?: string, onProgress?: (message: string) => void) {
        this.octokit = new Octokit({
            auth: token,
            userAgent: 'github-to-resume/1.0',
        });
        this.onProgress = onProgress;
    }

    private log(message: string) {
        if (this.onProgress) {
            this.onProgress(message);
        }
    }

    /**
     * Check and update rate limit from response headers
     */
    private updateRateLimit(headers: {
        'x-ratelimit-remaining'?: string;
        'x-ratelimit-reset'?: string;
        'x-ratelimit-limit'?: string;
    }) {
        if (headers['x-ratelimit-remaining']) {
            this.rateLimit = {
                remaining: parseInt(headers['x-ratelimit-remaining'], 10),
                reset: new Date(parseInt(headers['x-ratelimit-reset'] || '0', 10) * 1000),
                limit: parseInt(headers['x-ratelimit-limit'] || '60', 10),
            };
        }
    }

    /**
     * Wait if rate limit is low
     */
    private async checkRateLimit() {
        if (!this.rateLimit) return;

        if (this.rateLimit.remaining <= RATE_LIMIT_BUFFER) {
            const waitMs = this.rateLimit.reset.getTime() - Date.now();
            if (waitMs > 0) {
                this.log(`Rate limit low. Waiting ${Math.ceil(waitMs / 1000)}s...`);
                await sleep(Math.min(waitMs + 1000, 60000)); // Max 60s wait
            }
        }
    }

    /**
     * Get rate limit status
     */
    getRateLimitStatus(): RateLimitInfo | null {
        return this.rateLimit;
    }

    /**
     * Fetch user profile
     */
    async getUser(username: string): Promise<ProcessedUser> {
        await this.checkRateLimit();

        const response = await retry(
            () => this.octokit.users.getByUsername({ username }),
            {
                maxRetries: 3,
                shouldRetry: (error: unknown) => {
                    const err = error as { status?: number };
                    return err.status !== 404;
                },
            }
        );

        this.updateRateLimit(response.headers as Record<string, string>);
        const user = response.data as unknown as GitHubUser;

        return {
            id: user.id,
            username: user.login,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatar_url,
            profileUrl: user.html_url,
            bio: user.bio,
            location: user.location,
            blog: user.blog,
            twitter: user.twitter_username,
            company: user.company,
            publicRepos: user.public_repos,
            followers: user.followers,
        };
    }

    /**
     * Fetch user repositories
     */
    async getRepositories(username: string): Promise<ProcessedRepository[]> {
        await this.checkRateLimit();
        this.log('Fetching repositories...');

        const allRepos: GitHubRepository[] = [];
        let page = 1;

        // Fetch all repos with pagination
        while (true) {
            const response = await retry(
                () => this.octokit.repos.listForUser({
                    username,
                    sort: 'pushed',
                    direction: 'desc',
                    per_page: 100,
                    page,
                    type: 'owner', // Only repos owned by user
                }),
                { maxRetries: 3 }
            );

            this.updateRateLimit(response.headers as Record<string, string>);
            const repos = response.data as unknown as GitHubRepository[];

            if (repos.length === 0) break;
            allRepos.push(...repos);
            page++;

            // Safety limit
            if (allRepos.length >= 200) break;
        }

        this.log(`Found ${allRepos.length} repositories`);

        // Filter and score repositories
        const filteredRepos = allRepos
            .filter(repo => !repo.fork && !repo.archived && !repo.disabled)
            .map(repo => ({
                repo,
                score: this.calculateRepoScore(repo),
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, MAX_REPOS_TO_ANALYZE);

        this.log(`Selected ${filteredRepos.length} repositories for analysis`);

        // Fetch languages for each repo
        const processedRepos: ProcessedRepository[] = [];

        for (const { repo } of filteredRepos) {
            await this.checkRateLimit();

            let languages: GitHubLanguages = {};
            try {
                const langResponse = await this.octokit.repos.listLanguages({
                    owner: username,
                    repo: repo.name,
                });
                this.updateRateLimit(langResponse.headers as Record<string, string>);
                languages = langResponse.data as GitHubLanguages;
            } catch (error) {
                // Ignore language fetch errors
                console.error(`Failed to fetch languages for ${repo.name}:`, error);
            }

            const languageNames = Object.keys(languages);
            const primaryLanguage = languageNames.length > 0
                ? languageNames.reduce((a, b) => languages[a] > languages[b] ? a : b)
                : null;

            processedRepos.push({
                id: repo.id,
                name: repo.name,
                fullName: repo.full_name,
                description: repo.description,
                url: repo.html_url,
                homepage: repo.homepage,
                languages: languageNames,
                languageBytes: languages,
                primaryLanguage,
                stars: repo.stargazers_count,
                forks: repo.forks_count,
                topics: repo.topics || [],
                isFork: repo.fork,
                isArchived: repo.archived,
                pushedAt: repo.pushed_at,
                createdAt: repo.created_at,
                size: repo.size,
            });
        }

        return processedRepos;
    }

    /**
     * Calculate a score for repository prioritization
     */
    private calculateRepoScore(repo: GitHubRepository): number {
        let score = 0;

        // Stars (high weight)
        score += Math.min(repo.stargazers_count * 10, 500);

        // Forks
        score += Math.min(repo.forks_count * 5, 100);

        // Recent activity
        const daysSincePush = (Date.now() - new Date(repo.pushed_at).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSincePush < 30) score += 100;
        else if (daysSincePush < 90) score += 50;
        else if (daysSincePush < 365) score += 20;

        // Has description
        if (repo.description) score += 30;

        // Has topics
        score += Math.min((repo.topics?.length || 0) * 10, 50);

        // Size (not too small, not huge)
        if (repo.size > 10 && repo.size < 50000) score += 20;

        // Has homepage (deployed)
        if (repo.homepage) score += 40;

        return score;
    }

    /**
     * Fetch repository content (README, configs, source files)
     */
    async getRepositoryContent(
        owner: string,
        repo: string,
        tokenBudget: ContentBudget
    ): Promise<RepositoryContent> {
        const content: RepositoryContent = {
            readme: null,
            packageJson: null,
            requirementsTxt: null,
            sourceFiles: [],
            configFiles: [],
        };

        await this.checkRateLimit();

        // 1. Get repository tree to find files
        let tree: Array<{ path: string; type: string; size?: number }> = [];
        try {
            const treeResponse = await this.octokit.git.getTree({
                owner,
                repo,
                tree_sha: 'HEAD',
                recursive: 'true',
            });
            this.updateRateLimit(treeResponse.headers as Record<string, string>);
            tree = treeResponse.data.tree.filter(item => item.type === 'blob');
        } catch (error) {
            console.error(`Failed to get tree for ${repo}:`, error);
            return content;
        }

        // 2. Find and fetch README
        const readmeFile = tree.find(file =>
            /^readme\.md$/i.test(file.path) ||
            /^readme\.rst$/i.test(file.path) ||
            /^readme$/i.test(file.path)
        );

        if (readmeFile) {
            const readme = await this.fetchFileContent(owner, repo, readmeFile.path);
            if (readme) {
                content.readme = truncateToTokenLimit(readme, tokenBudget.readme);
            }
        }

        // 3. Find and fetch config files
        const configTokensPerFile = Math.floor(tokenBudget.configFiles / CONFIG_FILES.length);

        for (const configFile of CONFIG_FILES) {
            const file = tree.find(f =>
                f.path.toLowerCase() === configFile.toLowerCase() ||
                f.path.toLowerCase().endsWith('/' + configFile.toLowerCase())
            );

            if (file && (file.size || 0) < MAX_FILE_SIZE_BYTES) {
                const fileContent = await this.fetchFileContent(owner, repo, file.path);
                if (fileContent) {
                    // Parse package.json specially
                    if (file.path.toLowerCase() === 'package.json') {
                        try {
                            content.packageJson = JSON.parse(fileContent);
                        } catch {
                            // Invalid JSON, store as text
                        }
                    } else if (file.path.toLowerCase() === 'requirements.txt') {
                        content.requirementsTxt = fileContent;
                    }

                    content.configFiles.push({
                        path: file.path,
                        content: truncateToTokenLimit(fileContent, configTokensPerFile),
                        type: this.getConfigType(file.path),
                    });
                }
            }
        }

        // 4. Find and fetch source files
        const sourceTokensPerFile = Math.floor(tokenBudget.sourceFiles / MAX_SOURCE_FILES_PER_REPO);

        // Score and select best source files
        const sourceFileCandidates = tree
            .filter(file => {
                const ext = '.' + file.path.split('.').pop();
                const isSource = SOURCE_EXTENSIONS.includes(ext.toLowerCase());
                const isIgnored = IGNORE_PATTERNS.some(p => file.path.includes(p));
                const isSmallEnough = (file.size || 0) < MAX_FILE_SIZE_BYTES;
                return isSource && !isIgnored && isSmallEnough;
            })
            .map(file => ({
                ...file,
                score: this.scoreSourceFile(file.path),
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, MAX_SOURCE_FILES_PER_REPO);

        for (const file of sourceFileCandidates) {
            const fileContent = await this.fetchFileContent(owner, repo, file.path);
            if (fileContent) {
                const ext = '.' + file.path.split('.').pop();
                content.sourceFiles.push({
                    path: file.path,
                    content: truncateToTokenLimit(fileContent, sourceTokensPerFile),
                    language: this.getLanguageFromExtension(ext),
                });
            }
        }

        return content;
    }

    /**
     * Fetch a single file's content
     */
    private async fetchFileContent(
        owner: string,
        repo: string,
        path: string
    ): Promise<string | null> {
        try {
            await this.checkRateLimit();

            const response = await this.octokit.repos.getContent({
                owner,
                repo,
                path,
            });

            this.updateRateLimit(response.headers as Record<string, string>);

            const data = response.data as { content?: string; encoding?: string };

            if (data.content && data.encoding === 'base64') {
                return Buffer.from(data.content, 'base64').toString('utf-8');
            }

            return null;
        } catch (error) {
            console.error(`Failed to fetch ${path}:`, error);
            return null;
        }
    }

    /**
     * Score source files for priority (entry points, main files score higher)
     */
    private scoreSourceFile(path: string): number {
        const filename = path.split('/').pop()?.toLowerCase() || '';
        let score = 0;

        // Entry points
        if (filename.includes('main')) score += 100;
        if (filename.includes('index')) score += 90;
        if (filename.includes('app')) score += 80;
        if (filename.includes('server')) score += 70;

        // Important files
        if (filename.includes('route')) score += 60;
        if (filename.includes('api')) score += 60;
        if (filename.includes('model')) score += 50;
        if (filename.includes('controller')) score += 50;
        if (filename.includes('service')) score += 50;
        if (filename.includes('util')) score += 40;
        if (filename.includes('component')) score += 40;

        // Prefer root-level files
        const depth = path.split('/').length;
        score -= depth * 5;

        // Prefer TypeScript over JavaScript
        if (path.endsWith('.ts') || path.endsWith('.tsx')) score += 20;

        return score;
    }

    /**
     * Get config file type
     */
    private getConfigType(path: string): string {
        const filename = path.split('/').pop()?.toLowerCase() || '';

        if (filename === 'package.json') return 'npm';
        if (filename === 'requirements.txt' || filename === 'pipfile') return 'python';
        if (filename === 'cargo.toml') return 'rust';
        if (filename === 'go.mod') return 'go';
        if (filename === 'dockerfile' || filename.includes('docker-compose')) return 'docker';
        if (filename === 'gemfile') return 'ruby';
        if (filename === 'composer.json') return 'php';
        if (filename === 'pom.xml' || filename === 'build.gradle') return 'java';

        return 'other';
    }

    /**
     * Get language from file extension
     */
    private getLanguageFromExtension(ext: string): string {
        const map: Record<string, string> = {
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.py': 'python',
            '.go': 'go',
            '.rs': 'rust',
            '.java': 'java',
            '.kt': 'kotlin',
            '.rb': 'ruby',
            '.php': 'php',
            '.c': 'c',
            '.cpp': 'cpp',
            '.h': 'c',
            '.hpp': 'cpp',
            '.cs': 'csharp',
            '.swift': 'swift',
        };

        return map[ext.toLowerCase()] || 'unknown';
    }
}

// Singleton for server-side use
let client: GitHubClient | null = null;

export function getGitHubClient(
    token?: string,
    onProgress?: (message: string) => void
): GitHubClient {
    if (!client || onProgress) {
        client = new GitHubClient(token, onProgress);
    }
    return client;
}
