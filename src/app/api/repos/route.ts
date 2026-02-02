/**
 * Repos API Route
 * 
 * GET /api/repos?username=xxx
 * Fetches list of repositories for a user (lightweight, no content)
 */

import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import { isValidGitHubUsername, parseGitHubUrl } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface RepoInfo {
    id: number;
    name: string;
    fullName: string;
    description: string | null;
    url: string;
    homepage: string | null;
    language: string | null;
    languages: string[];
    stars: number;
    forks: number;
    topics: string[];
    pushedAt: string;
    createdAt: string;
    size: number;
    isFork: boolean;
    isArchived: boolean;
    score: number; // Our relevance score
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        let username = searchParams.get('username')?.trim();

        if (!username) {
            return NextResponse.json(
                { error: 'GitHub username is required' },
                { status: 400 }
            );
        }

        // Try to parse as URL
        const parsed = parseGitHubUrl(username);
        if (parsed) {
            username = parsed.username;
        }

        // Validate username
        if (!isValidGitHubUsername(username)) {
            return NextResponse.json(
                { error: 'Invalid GitHub username format' },
                { status: 400 }
            );
        }

        // Create Octokit client
        const octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN,
            userAgent: 'github-to-resume/1.0',
        });

        // Fetch user info
        const userResponse = await octokit.users.getByUsername({ username });
        const user = userResponse.data;

        // Fetch repositories
        const allRepos: RepoInfo[] = [];
        let page = 1;

        while (true) {
            const response = await octokit.repos.listForUser({
                username,
                sort: 'pushed',
                direction: 'desc',
                per_page: 100,
                page,
                type: 'owner',
            });

            if (response.data.length === 0) break;

            for (const repo of response.data) {
                // Skip forks and archived by default but still include them
                const score = calculateScore({
                    stargazers_count: repo.stargazers_count ?? 0,
                    forks_count: repo.forks_count ?? 0,
                    pushed_at: repo.pushed_at ?? null,
                    description: repo.description ?? null,
                    topics: repo.topics,
                    size: repo.size ?? 0,
                    homepage: repo.homepage ?? null,
                    fork: repo.fork,
                    archived: repo.archived,
                });

                allRepos.push({
                    id: repo.id,
                    name: repo.name,
                    fullName: repo.full_name,
                    description: repo.description ?? null,
                    url: repo.html_url,
                    homepage: repo.homepage ?? null,
                    language: repo.language ?? null,
                    languages: repo.language ? [repo.language] : [],
                    stars: repo.stargazers_count ?? 0,
                    forks: repo.forks_count ?? 0,
                    topics: repo.topics || [],
                    pushedAt: repo.pushed_at || '',
                    createdAt: repo.created_at || '',
                    size: repo.size ?? 0,
                    isFork: repo.fork,
                    isArchived: repo.archived || false,
                    score,
                });
            }

            page++;
            if (allRepos.length >= 200) break; // Safety limit
        }

        // Sort by score
        allRepos.sort((a, b) => b.score - a.score);

        return NextResponse.json({
            success: true,
            data: {
                user: {
                    username: user.login,
                    name: user.name,
                    avatarUrl: user.avatar_url,
                    bio: user.bio,
                    publicRepos: user.public_repos,
                },
                repos: allRepos,
                // Pre-select top repos (non-fork, non-archived, score > 50)
                suggested: allRepos
                    .filter(r => !r.isFork && !r.isArchived && r.score > 50)
                    .slice(0, 10)
                    .map(r => r.name),
            },
        });
    } catch (error) {
        console.error('Repos fetch error:', error);

        if (error instanceof Error) {
            if (error.message.includes('Not Found')) {
                return NextResponse.json(
                    { error: 'GitHub user not found' },
                    { status: 404 }
                );
            }
            if (error.message.includes('rate limit')) {
                return NextResponse.json(
                    { error: 'GitHub API rate limit exceeded. Please add a GitHub token or try again later.' },
                    { status: 429 }
                );
            }
        }

        return NextResponse.json(
            { error: 'Failed to fetch repositories' },
            { status: 500 }
        );
    }
}

/**
 * Calculate relevance score for a repository
 */
function calculateScore(repo: {
    stargazers_count: number;
    forks_count: number;
    pushed_at: string | null;
    description: string | null;
    topics?: string[];
    size: number;
    homepage: string | null;
    fork: boolean;
    archived?: boolean;
}): number {
    let score = 0;

    // Penalize forks and archived
    if (repo.fork) score -= 100;
    if (repo.archived) score -= 50;

    // Stars (high weight)
    score += Math.min(repo.stargazers_count * 10, 500);

    // Forks
    score += Math.min(repo.forks_count * 5, 100);

    // Recent activity
    if (repo.pushed_at) {
        const daysSincePush = (Date.now() - new Date(repo.pushed_at).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSincePush < 30) score += 100;
        else if (daysSincePush < 90) score += 50;
        else if (daysSincePush < 365) score += 20;
    }

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
