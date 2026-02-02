/**
 * Bullet Point Enhancement API Route
 * 
 * POST /api/enhance
 * Enhances a resume bullet point using AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { enhanceBulletPoint } from '@/lib/llm';

interface EnhanceRequest {
    bullet: string;
    context?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as EnhanceRequest;

        if (!body.bullet?.trim()) {
            return NextResponse.json(
                { error: 'Bullet point text is required' },
                { status: 400 }
            );
        }

        const openaiApiKey = process.env.OPENAI_API_KEY;
        if (!openaiApiKey) {
            return NextResponse.json(
                { error: 'OpenAI API key not configured' },
                { status: 500 }
            );
        }

        const result = await enhanceBulletPoint(body.bullet, body.context, {
            apiKey: openaiApiKey,
        });

        return NextResponse.json({
            success: true,
            data: {
                original: body.bullet,
                enhanced: result.enhanced,
                tokenUsage: {
                    totalTokens: result.tokenUsage.totalTokens,
                    estimatedCost: result.tokenUsage.estimatedCost.toFixed(4),
                },
            },
        });
    } catch (error) {
        console.error('Enhancement error:', error);
        return NextResponse.json(
            { error: 'Failed to enhance bullet point' },
            { status: 500 }
        );
    }
}
