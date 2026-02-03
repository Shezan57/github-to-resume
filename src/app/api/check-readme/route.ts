/**
 * Check README API Route
 * 
 * POST /api/check-readme
 * Checks README status for a list of repositories
 */

import { NextRequest, NextResponse } from 'next/server';
import { GitHubClient } from '@/lib/github';
import { isValidGitHubUsername } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface CheckReadmeRequest {
    username: string;
    repos: string[]; // List of repo names to check
}

interface ReadmeStatus {
    repoName: string;
    hasReadme: boolean;
    filename: string | null;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as CheckReadmeRequest;
        const { username, repos } = body;

        // Validate inputs
        if (!username || !repos || repos.length === 0) {
            return NextResponse.json(
                { error: 'Username and list of repos are required' },
                { status: 400 }
            );
        }

        if (!isValidGitHubUsername(username)) {
            return NextResponse.json(
                { error: 'Invalid GitHub username format' },
                { status: 400 }
            );
        }

        // Limit to 20 repos max
        const reposToCheck = repos.slice(0, 20);

        // Create GitHub client
        const github = new GitHubClient(undefined, (msg) => {
            console.log(`[GitHub] ${msg}`);
        });

        // Check README for each repo
        const results: ReadmeStatus[] = [];

        for (const repoName of reposToCheck) {
            try {
                const readmeInfo = await github.getReadmeOnly(username, repoName);
                results.push({
                    repoName,
                    hasReadme: readmeInfo.hasReadme,
                    filename: readmeInfo.filename,
                });
            } catch (error) {
                console.error(`Failed to check README for ${repoName}:`, error);
                results.push({
                    repoName,
                    hasReadme: false,
                    filename: null,
                });
            }
        }

        // Count repos with and without README
        const withReadme = results.filter(r => r.hasReadme).length;
        const withoutReadme = results.filter(r => !r.hasReadme).length;

        return NextResponse.json({
            success: true,
            data: {
                results,
                summary: {
                    total: results.length,
                    withReadme,
                    withoutReadme,
                },
            },
        });
    } catch (error) {
        console.error('Check README error:', error);

        if (error instanceof Error) {
            if (error.message.includes('rate limit')) {
                return NextResponse.json(
                    { error: 'GitHub API rate limit exceeded. Try again later.' },
                    { status: 429 }
                );
            }
        }

        return NextResponse.json(
            { error: 'Failed to check README status' },
            { status: 500 }
        );
    }
}
