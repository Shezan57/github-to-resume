/**
 * GitHub Analysis API Route
 * 
 * POST /api/analyze
 * Triggers analysis of a GitHub profile and generates a resume
 */

import { NextRequest, NextResponse } from 'next/server';
import { runAnalysis, type AnalysisProgress } from '@/lib/orchestrator';
import { isValidGitHubUsername, parseGitHubUrl } from '@/lib/utils';

export const maxDuration = 300; // 5 minutes for Vercel
export const dynamic = 'force-dynamic';

interface AnalyzeRequest {
    username: string;
    githubToken?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as AnalyzeRequest;

        // Parse username from URL or direct input
        let username = body.username?.trim();

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

        // Get OpenAI API key from environment
        const openaiApiKey = process.env.OPENAI_API_KEY;
        if (!openaiApiKey) {
            return NextResponse.json(
                { error: 'OpenAI API key not configured' },
                { status: 500 }
            );
        }

        // Run the analysis
        const result = await runAnalysis(username, {
            githubToken: body.githubToken,
            openaiApiKey,
            verbose: process.env.NODE_ENV === 'development',
        });

        return NextResponse.json({
            success: true,
            data: {
                user: result.user,
                resume: result.resume,
                repositoriesAnalyzed: result.repositories.length,
                tokenUsage: {
                    totalTokens: result.tokenUsage.total.totalTokens,
                    estimatedCost: result.tokenUsage.total.estimatedCost.toFixed(4),
                },
                timing: {
                    durationMs: result.timing.durationMs,
                    durationSeconds: (result.timing.durationMs / 1000).toFixed(1),
                },
            },
        });
    } catch (error) {
        console.error('Analysis error:', error);

        // Handle specific error types
        if (error instanceof Error) {
            if (error.message.includes('Not Found')) {
                return NextResponse.json(
                    { error: 'GitHub user not found' },
                    { status: 404 }
                );
            }
            if (error.message.includes('rate limit')) {
                return NextResponse.json(
                    { error: 'GitHub API rate limit exceeded. Please try again later.' },
                    { status: 429 }
                );
            }
            if (error.message.includes('API key')) {
                return NextResponse.json(
                    { error: 'Invalid or missing API key' },
                    { status: 401 }
                );
            }
        }

        return NextResponse.json(
            { error: 'Failed to analyze GitHub profile' },
            { status: 500 }
        );
    }
}
