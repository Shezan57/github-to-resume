/**
 * ATS Check API Route
 * 
 * POST /api/ats-check
 * Analyzes a resume for ATS compatibility
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeATSScore, type ATSScore } from '@/lib/ats-scorer';
import type { Resume } from '@/types';

export const dynamic = 'force-dynamic';

// Simple in-memory usage tracking (in production, use Redis or DB)
const usageStore = new Map<string, { count: number; lastReset: Date }>();
const FREE_TIER_LIMIT = 3;

function getUsageKey(request: NextRequest): string {
    // Use IP address or a session identifier
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
}

export async function POST(request: NextRequest) {
    try {
        const usageKey = getUsageKey(request);
        const { allowed, remaining } = checkUsageLimit(usageKey);

        // Check free tier limit
        if (!allowed) {
            return NextResponse.json(
                {
                    error: 'Free tier limit reached',
                    message: 'You have used all 3 free ATS checks for today. Upgrade to Premium for unlimited checks.',
                    upgradeRequired: true,
                },
                { status: 429 }
            );
        }

        const body = await request.json() as ATSCheckRequest;
        const { resume, targetRole } = body;

        if (!resume) {
            return NextResponse.json(
                { error: 'Resume data is required' },
                { status: 400 }
            );
        }

        // Analyze the resume
        const score: ATSScore = analyzeATSScore(resume, targetRole);

        // Increment usage
        incrementUsage(usageKey);

        return NextResponse.json({
            success: true,
            data: {
                score,
                usage: {
                    remaining: remaining - 1,
                    limit: FREE_TIER_LIMIT,
                },
            },
        });
    } catch (error) {
        console.error('ATS check error:', error);

        return NextResponse.json(
            { error: 'Failed to analyze resume' },
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
