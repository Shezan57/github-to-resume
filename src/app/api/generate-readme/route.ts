/**
 * Generate README API Route
 * 
 * POST /api/generate-readme
 * Generates a README.md file for a repository that doesn't have one
 */

import { NextRequest, NextResponse } from 'next/server';
import { GitHubClient } from '@/lib/github';
import { generateReadme } from '@/lib/llm/readme-generator';
import { isValidGitHubUsername } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface GenerateReadmeRequest {
    username: string;
    repoName: string;
    description?: string;
    language?: string;
    topics?: string[];
    homepage?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as GenerateReadmeRequest;
        const { username, repoName, description, language, topics, homepage } = body;

        // Validate inputs
        if (!username || !repoName) {
            return NextResponse.json(
                { error: 'Username and repository name are required' },
                { status: 400 }
            );
        }

        if (!isValidGitHubUsername(username)) {
            return NextResponse.json(
                { error: 'Invalid GitHub username format' },
                { status: 400 }
            );
        }

        // Create GitHub client
        const github = new GitHubClient(undefined, (msg) => {
            console.log(`[GitHub] ${msg}`);
        });

        // Get repository structure for context
        console.log(`[README Generator] Fetching structure for ${username}/${repoName}`);
        const structure = await github.getRepoStructure(username, repoName);

        // Generate README using LLM
        const result = await generateReadme({
            name: repoName,
            description: description || null,
            language: language || null,
            topics: topics || [],
            homepage: homepage || null,
            structure,
        }, {
            apiKey: process.env.OPENAI_API_KEY,
            verbose: process.env.NODE_ENV === 'development',
        });

        return NextResponse.json({
            success: true,
            data: {
                readme: result.readme,
                tokenUsage: {
                    totalTokens: result.tokenUsage.totalTokens,
                    estimatedCost: result.tokenUsage.estimatedCost.toFixed(4),
                },
            },
        });
    } catch (error) {
        console.error('Generate README error:', error);

        if (error instanceof Error) {
            if (error.message.includes('rate limit')) {
                return NextResponse.json(
                    { error: 'GitHub API rate limit exceeded. Try again later.' },
                    { status: 429 }
                );
            }
        }

        return NextResponse.json(
            { error: 'Failed to generate README' },
            { status: 500 }
        );
    }
}
