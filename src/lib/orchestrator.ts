/**
 * Analysis Orchestrator
 * 
 * Main entry point that coordinates the entire analysis pipeline:
 * 1. Fetch GitHub profile and repositories
 * 2. Fetch content for each repository
 * 3. Analyze each repository with LLM
 * 4. Generate final resume
 * 
 * Supports progress callbacks for UI updates.
 */

import { GitHubClient } from './github';
import { analyzeRepository, generateResume } from './llm';
import { allocateTokenBudget, getAvailableTokens, type TokenUsage } from './tokens';
import {
    ProcessedUser,
    ProcessedRepository,
    RepositoryAnalysis,
    AnalysisJob,
    AnalysisStatus,
    Resume,
} from '@/types';
import { generateId, sleep } from './utils';

export interface AnalysisProgress {
    status: AnalysisStatus;
    current: number;
    total: number;
    currentRepo?: string;
    message: string;
}

export interface AnalysisOptions {
    githubToken?: string;
    openaiApiKey?: string;
    selectedRepos?: string[]; // Only analyze these repos if provided
    maxRepos?: number;
    onProgress?: (progress: AnalysisProgress) => void;
    verbose?: boolean;
    targetRole?: string;  // e.g., 'software-engineer', 'data-scientist'
    customRole?: string;  // Custom role entered by user
}

export interface AnalysisResult {
    user: ProcessedUser;
    repositories: ProcessedRepository[];
    analyses: RepositoryAnalysis[];
    resume: Resume;
    tokenUsage: {
        total: TokenUsage;
        perRepo: Map<string, TokenUsage>;
    };
    timing: {
        startTime: Date;
        endTime: Date;
        durationMs: number;
        fetchDurationMs: number;
        analysisDurationMs: number;
        generationDurationMs: number;
    };
}

/**
 * Run the complete analysis pipeline
 */
export async function runAnalysis(
    username: string,
    options: AnalysisOptions = {}
): Promise<AnalysisResult> {
    const {
        githubToken,
        openaiApiKey,
        selectedRepos,
        maxRepos = 20,
        onProgress,
        verbose = false,
        targetRole,
        customRole,
    } = options;

    const startTime = new Date();
    let fetchEndTime: Date;
    let analysisEndTime: Date;

    const emitProgress = (progress: AnalysisProgress) => {
        if (verbose) {
            console.log(`[${progress.status}] ${progress.message} (${progress.current}/${progress.total})`);
        }
        if (onProgress) {
            onProgress(progress);
        }
    };

    // Initialize clients
    const github = new GitHubClient(githubToken, (msg) => {
        if (verbose) console.log(`[GitHub] ${msg}`);
    });

    // Token usage tracking
    const totalUsage: TokenUsage = {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        estimatedCost: 0,
    };
    const perRepoUsage = new Map<string, TokenUsage>();

    try {
        // Step 1: Fetch user profile
        emitProgress({
            status: 'fetching_profile',
            current: 0,
            total: 1,
            message: `Fetching profile for ${username}...`,
        });

        const user = await github.getUser(username);

        emitProgress({
            status: 'fetching_repos',
            current: 0,
            total: 1,
            message: 'Fetching repositories...',
        });

        // Step 2: Fetch repositories
        const repositories = await github.getRepositories(username);

        // Filter to user-selected repos if provided
        let reposToAnalyze: ProcessedRepository[];
        if (selectedRepos && selectedRepos.length > 0) {
            reposToAnalyze = repositories.filter(r => selectedRepos.includes(r.name));
        } else {
            reposToAnalyze = repositories.slice(0, maxRepos);
        }

        fetchEndTime = new Date();

        emitProgress({
            status: 'analyzing_repos',
            current: 0,
            total: reposToAnalyze.length,
            message: `Analyzing ${reposToAnalyze.length} repositories...`,
        });

        // Step 3: Analyze each repository
        const analyses: RepositoryAnalysis[] = [];
        const tokenBudget = allocateTokenBudget(getAvailableTokens());

        for (let i = 0; i < reposToAnalyze.length; i++) {
            const repo = reposToAnalyze[i];

            emitProgress({
                status: 'analyzing_repos',
                current: i + 1,
                total: reposToAnalyze.length,
                currentRepo: repo.name,
                message: `Analyzing ${repo.name}...`,
            });

            try {
                // Fetch repository content
                const content = await github.getRepositoryContent(
                    username,
                    repo.name,
                    tokenBudget
                );

                // Analyze with LLM
                const result = await analyzeRepository(repo, content, {
                    apiKey: openaiApiKey,
                    verbose,
                    onProgress: (msg) => {
                        if (verbose) console.log(`  [Analyzer] ${msg}`);
                    },
                });

                analyses.push(result.analysis);

                // Track token usage
                perRepoUsage.set(repo.name, result.tokenUsage);
                totalUsage.inputTokens += result.tokenUsage.inputTokens;
                totalUsage.outputTokens += result.tokenUsage.outputTokens;
                totalUsage.totalTokens += result.tokenUsage.totalTokens;
                totalUsage.estimatedCost += result.tokenUsage.estimatedCost;

                // Small delay to avoid rate limits
                await sleep(200);
            } catch (error) {
                console.error(`Failed to analyze ${repo.name}:`, error);
                // Create a basic analysis for failed repos
                analyses.push({
                    projectName: repo.name,
                    oneLiner: repo.description || `A ${repo.primaryLanguage || 'software'} project`,
                    detailedSummary: repo.description || 'Analysis failed.',
                    problemSolved: 'Not specified',
                    technologies: repo.languages,
                    skillsDemonstrated: [],
                    complexityScore: 3,
                    projectType: 'other',
                    achievements: [],
                    resumeBulletPoints: [`Developed ${repo.name}`],
                });
            }
        }

        analysisEndTime = new Date();

        // Step 4: Generate resume
        emitProgress({
            status: 'generating_resume',
            current: reposToAnalyze.length,
            total: reposToAnalyze.length,
            message: 'Generating your resume...',
        });

        const resumeResult = await generateResume(user, analyses, {
            apiKey: openaiApiKey,
            verbose,
            targetRole,
            customRole,
            onProgress: (msg) => {
                if (verbose) console.log(`[Generator] ${msg}`);
            },
        });

        // Update total token usage
        totalUsage.inputTokens += resumeResult.tokenUsage.inputTokens;
        totalUsage.outputTokens += resumeResult.tokenUsage.outputTokens;
        totalUsage.totalTokens += resumeResult.tokenUsage.totalTokens;
        totalUsage.estimatedCost += resumeResult.tokenUsage.estimatedCost;

        const endTime = new Date();

        emitProgress({
            status: 'completed',
            current: reposToAnalyze.length,
            total: reposToAnalyze.length,
            message: 'Resume generation complete!',
        });

        return {
            user,
            repositories: reposToAnalyze,
            analyses,
            resume: resumeResult.resume,
            tokenUsage: {
                total: totalUsage,
                perRepo: perRepoUsage,
            },
            timing: {
                startTime,
                endTime,
                durationMs: endTime.getTime() - startTime.getTime(),
                fetchDurationMs: fetchEndTime.getTime() - startTime.getTime(),
                analysisDurationMs: analysisEndTime.getTime() - fetchEndTime.getTime(),
                generationDurationMs: endTime.getTime() - analysisEndTime.getTime(),
            },
        };
    } catch (error) {
        emitProgress({
            status: 'failed',
            current: 0,
            total: 0,
            message: error instanceof Error ? error.message : 'Analysis failed',
        });
        throw error;
    }
}

/**
 * Create an analysis job for tracking in the database
 */
export function createAnalysisJob(username: string): AnalysisJob {
    const now = new Date().toISOString();
    return {
        id: generateId(),
        username,
        status: 'queued',
        progress: {
            current: 0,
            total: 0,
            message: 'Queued for processing',
        },
        createdAt: now,
        updatedAt: now,
    };
}

/**
 * Update an analysis job with current progress
 */
export function updateAnalysisJob(
    job: AnalysisJob,
    progress: AnalysisProgress
): AnalysisJob {
    return {
        ...job,
        status: progress.status,
        progress: {
            current: progress.current,
            total: progress.total,
            currentRepo: progress.currentRepo,
            message: progress.message,
        },
        updatedAt: new Date().toISOString(),
    };
}
