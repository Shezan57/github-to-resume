/**
 * ATS Check API Route
 * 
 * POST /api/ats-check
 * Analyzes a resume for ATS compatibility
 * 
 * Supports two modes:
 * - "quick" (default): Rule-based analysis, fast and free
 * - "ai": LLM-powered analysis, more accurate but uses tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeATSScore, type ATSScore } from '@/lib/ats-scorer';
import { analyzeATSWithLLM, fixWithLLM, optimizeSummaryWithLLM, type LLMATSResult } from '@/lib/llm/ats-analyzer';
import type { Resume } from '@/types';

export const dynamic = 'force-dynamic';

// Simple in-memory usage tracking (in production, use Redis or DB)
const usageStore = new Map<string, { count: number; lastReset: Date }>();
const FREE_TIER_LIMIT = 10; // Increased for AI mode

function getUsageKey(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    return `ats_usage_${ip}`;
}

function checkUsageLimit(key: string): { allowed: boolean; remaining: number } {
    const now = new Date();
    const usage = usageStore.get(key);

    // Reset daily
    if (usage && now.getTime() - usage.lastReset.getTime() > 24 * 60 * 60 * 1000) {
        usageStore.delete(key);
    }

    const current = usageStore.get(key) || { count: 0, lastReset: now };
    const remaining = Math.max(0, FREE_TIER_LIMIT - current.count);

    return {
        allowed: current.count < FREE_TIER_LIMIT,
        remaining,
    };
}

function incrementUsage(key: string): void {
    const now = new Date();
    const usage = usageStore.get(key) || { count: 0, lastReset: now };
    usage.count++;
    usageStore.set(key, usage);
}

interface ATSCheckRequest {
    resume: Resume;
    targetRole?: string;
    mode?: 'quick' | 'ai';
    tier?: string;
}

interface ATSFixRequest {
    action: 'fix';
    originalText: string;
    issue: string;
    context?: string;
    tier?: string;
}

interface OptimizeSummaryRequest {
    action: 'optimize-summary';
    currentSummary: string;
    targetRole: string;
    skills: string[];
    tier?: string;
}

type RequestBody = ATSCheckRequest | ATSFixRequest | OptimizeSummaryRequest;

export async function POST(request: NextRequest) {
    try {
        const usageKey = getUsageKey(request);
        const { allowed, remaining } = checkUsageLimit(usageKey);

        const body = await request.json() as RequestBody;

        // Handle fix action
        if ('action' in body && body.action === 'fix') {
            const { originalText, issue, context, tier } = body as ATSFixRequest;

            if (!originalText || !issue) {
                return NextResponse.json(
                    { error: 'originalText and issue are required' },
                    { status: 400 }
                );
            }

            // Use 'groq' as default if not specified or invalid
            const provider = tier === 'openai' ? 'openai' : 'groq';
            const result = await fixWithLLM(originalText, issue, context, provider);
            incrementUsage(usageKey);

            return NextResponse.json({
                success: true,
                data: result,
                usage: { remaining: remaining - 1, limit: FREE_TIER_LIMIT },
            });
        }

        // Handle optimize summary action
        if ('action' in body && body.action === 'optimize-summary') {
            const { currentSummary, targetRole, skills, tier } = body as OptimizeSummaryRequest;

            if (!currentSummary || !targetRole) {
                return NextResponse.json(
                    { error: 'currentSummary and targetRole are required' },
                    { status: 400 }
                );
            }

            // Use 'groq' as default if not specified or invalid
            const provider = tier === 'openai' ? 'openai' : 'groq';
            const result = await optimizeSummaryWithLLM(currentSummary, targetRole, skills || [], provider);
            incrementUsage(usageKey);

            return NextResponse.json({
                success: true,
                data: result,
                usage: { remaining: remaining - 1, limit: FREE_TIER_LIMIT },
            });
        }

        // Handle ATS analysis
        const { resume, targetRole, mode = 'quick' } = body as ATSCheckRequest;

        if (!resume) {
            return NextResponse.json(
                { error: 'Resume data is required' },
                { status: 400 }
            );
        }

        // Check free tier limit for AI mode
        if (mode === 'ai' && !allowed) {
            return NextResponse.json(
                {
                    error: 'Free tier limit reached',
                    message: `You have used all ${FREE_TIER_LIMIT} free AI checks for today.`,
                    upgradeRequired: true,
                },
                { status: 429 }
            );
        }

        if (mode === 'ai') {
            // LLM-powered analysis
            // Use 'groq' as default if not specified or invalid
            const tier = (body as any).tier === 'openai' ? 'openai' : 'groq';

            const aiScore = await analyzeATSWithLLM(resume, targetRole, tier);
            incrementUsage(usageKey);

            return NextResponse.json({
                success: true,
                data: {
                    score: {
                        overall: aiScore.overallScore,
                        breakdown: aiScore.breakdown,
                        suggestions: [],
                        keywordAnalysis: { found: [], missing: [] }
                    },
                    aiResult: aiScore,
                    mode,
                    usage: { remaining: remaining - 1, limit: FREE_TIER_LIMIT }
                }
            });
        } else {
            // Quick rule-based analysis
            const score = analyzeATSScore(resume, targetRole);

            return NextResponse.json({
                success: true,
                data: {
                    score,
                    mode,
                    usage: {
                        remaining: remaining, // No usage increment for quick mode
                        limit: FREE_TIER_LIMIT,
                    },
                },
            });
        }
    } catch (error) {
        console.error('ATS check error:', error);

        return NextResponse.json(
            {
                error: 'Failed to analyze resume',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// GET endpoint to check remaining usage
export async function GET(request: NextRequest) {
    const usageKey = getUsageKey(request);
    const { remaining } = checkUsageLimit(usageKey);

    return NextResponse.json({
        success: true,
        data: {
            remaining,
            limit: FREE_TIER_LIMIT,
        },
    });
}
