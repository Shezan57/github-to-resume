import { UnifiedLLMService } from './llm-service';
import { LLMRequest, LLMProvider } from './types';
import type { Resume } from '@/types';
import { calculateCost, type TokenUsage } from '../tokens';

// Types for LLM ATS analysis
export interface LLMATSResult {
    overallScore: number; // 0-100
    breakdown: {
        keywords: { score: number; feedback: string };
        impact: { score: number; feedback: string };
        actionVerbs: { score: number; feedback: string };
        formatting: { score: number; feedback: string };
        roleAlignment: { score: number; feedback: string };
    };
    suggestions: LLMSuggestion[];
    strengths: string[];
    tokenUsage: TokenUsage;
}

export interface LLMSuggestion {
    id: string;
    severity: 'critical' | 'important' | 'minor';
    category: 'keywords' | 'impact' | 'actionVerbs' | 'formatting' | 'roleAlignment';
    issue: string;
    suggestion: string;
    originalText?: string;
    fixedText?: string;
    location?: string; // e.g., "summary", "project:0:bullet:1"
}

export interface FixResult {
    fixed: string;
    explanation: string;
    tokenUsage: TokenUsage;
}

/**
 * Analyze resume with LLM for comprehensive ATS scoring
 */
export async function analyzeATSWithLLM(
    resume: Resume,
    targetRole?: string,
    tier: LLMProvider = 'groq'
): Promise<LLMATSResult> {
    const llmService = new UnifiedLLMService(tier);

    // Build resume content for analysis
    const resumeContent = buildResumeContent(resume);
    const roleContext = targetRole
        ? `The candidate is targeting a "${targetRole}" role.`
        : 'No specific target role specified.';

    const systemPrompt = `You are an expert ATS (Applicant Tracking System) analyzer and resume consultant. 
Your task is to analyze resumes for ATS compatibility and provide actionable feedback.

ATS systems look for:
1. **Keywords**: Industry-specific terms, technologies, skills that match job descriptions
2. **Impact/Quantification**: Numbers, percentages, metrics that show measurable results
3. **Action Verbs**: Strong verbs like "developed", "implemented", "led", "optimized"
4. **Formatting**: Clean structure, appropriate length, no ATS-unfriendly elements
5. **Role Alignment**: How well the content matches the target role

Analyze the resume and provide:
- Scores (0-100) for each category
- Specific, actionable suggestions with fixable issues
- For each issue found, provide the original text and a suggested improvement

IMPORTANT: Be specific but CONCISE to avoid cutting off response. Don't just say "add metrics" - identify the exact bullet point and suggest a specific improvement.`;

    const userPrompt = `${roleContext}

RESUME CONTENT:
${resumeContent}

Provide a comprehensive ATS analysis in this exact JSON format:
{
    "overallScore": <number 0-100>,
    "breakdown": {
        "keywords": { "score": <number>, "feedback": "<brief feedback>" },
        "impact": { "score": <number>, "feedback": "<brief feedback>" },
        "actionVerbs": { "score": <number>, "feedback": "<brief feedback>" },
        "formatting": { "score": <number>, "feedback": "<brief feedback>" },
        "roleAlignment": { "score": <number>, "feedback": "<brief feedback>" }
    },
    "strengths": ["<strength 1>", "<strength 2>", ...],
    "suggestions": [
        {
            "severity": "critical|important|minor",
            "category": "keywords|impact|actionVerbs|formatting|roleAlignment",
            "issue": "<what's wrong>",
            "suggestion": "<how to fix it>",
            "originalText": "<exact text from resume if applicable>",
            "fixedText": "<improved version>",
            "location": "<where in resume: summary, project:0:bullet:1, etc>"
        }
    ]
}

Return ONLY valid JSON, no markdown code blocks.`;

    try {
        const response = await llmService.chat({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            maxTokens: 4096, // Increase limit to prevent JSON truncation
            jsonMode: tier === 'openai' // Only OpenAI supports guaranteed JSON mode reliably via API flag
        });

        // Parse content - robustly handle markdown and extra text
        const content = cleanJSON(response.content);

        const parsed = JSON.parse(content.trim());

        // Add IDs to suggestions
        const suggestions = (parsed.suggestions || []).map((s: Omit<LLMSuggestion, 'id'>, i: number) => ({
            ...s,
            id: `suggestion-${i}-${Date.now()}`
        }));

        return {
            overallScore: parsed.overallScore || 50,
            breakdown: parsed.breakdown || {
                keywords: { score: 50, feedback: 'Unable to analyze' },
                impact: { score: 50, feedback: 'Unable to analyze' },
                actionVerbs: { score: 50, feedback: 'Unable to analyze' },
                formatting: { score: 50, feedback: 'Unable to analyze' },
                roleAlignment: { score: 50, feedback: 'Unable to analyze' }
            },
            suggestions,
            strengths: parsed.strengths || [],
            tokenUsage: {
                // Map the new service usage format to the existing TokenUsage type
                inputTokens: response.usage?.promptTokens || 0,
                outputTokens: response.usage?.completionTokens || 0,
                totalTokens: response.usage?.totalTokens || 0,
                estimatedCost: response.usage?.cost || 0
            }
        };
    } catch (error) {
        console.error('ATS Analysis Error:', error);
        return {
            overallScore: 50,
            breakdown: {
                keywords: { score: 50, feedback: 'Analysis failed' },
                impact: { score: 50, feedback: 'Analysis failed' },
                actionVerbs: { score: 50, feedback: 'Analysis failed' },
                formatting: { score: 50, feedback: 'Analysis failed' },
                roleAlignment: { score: 50, feedback: 'Analysis failed' }
            },
            suggestions: [],
            strengths: [],
            tokenUsage: { totalTokens: 0, inputTokens: 0, outputTokens: 0, estimatedCost: 0 }
        };
    }
}

/**
 * Fix a specific piece of text using AI
 */
export async function fixWithLLM(
    originalText: string,
    issue: string,
    context?: string,
    tier: LLMProvider = 'groq'
): Promise<FixResult> {
    const llmService = new UnifiedLLMService(tier);

    const systemPrompt = `You are an expert resume writer. Your task is to improve resume content for ATS optimization.

Rules:
1. Keep the core meaning intact
2. Use strong action verbs (developed, implemented, led, optimized, etc.)
3. Add quantifiable metrics where possible (%, numbers, scale)
4. Be concise but impactful
5. Use industry-standard terminology`;

    const contextInfo = context ? `\nContext: ${context}` : '';

    const userPrompt = `Issue: ${issue}${contextInfo}

Original text: "${originalText}"

Provide an improved version that fixes the issue. Return JSON:
{
    "fixed": "<improved text>",
    "explanation": "<brief explanation of changes>"
}

Return ONLY valid JSON.`;

    try {
        const response = await llmService.chat({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.5,
            maxTokens: 500,
            jsonMode: tier === 'openai'
        });

        const content = cleanJSON(response.content);

        const parsed = JSON.parse(content.trim());
        return {
            fixed: parsed.fixed || originalText,
            explanation: parsed.explanation || 'Text improved',
            tokenUsage: {
                totalTokens: response.usage?.totalTokens || 0,
                inputTokens: response.usage?.promptTokens || 0,
                outputTokens: response.usage?.completionTokens || 0,
                estimatedCost: response.usage?.cost || 0
            }
        };
    } catch {
        return {
            fixed: originalText,
            explanation: 'Could not generate fix',
            tokenUsage: { totalTokens: 0, inputTokens: 0, outputTokens: 0, estimatedCost: 0 }
        };
    }
}

/**
 * Optimize entire summary for a target role
 */
export async function optimizeSummaryWithLLM(
    currentSummary: string,
    targetRole: string,
    skills: string[],
    tier: LLMProvider = 'groq'
): Promise<FixResult> {
    const llmService = new UnifiedLLMService(tier);

    const systemPrompt = `You are an expert resume writer specializing in professional summaries.

A great professional summary:
1. Opens with years of experience and role/specialty
2. Highlights 2-3 key technical skills relevant to the target role
3. Mentions a notable achievement or impact
4. Is 2-3 sentences, around 50-80 words
5. Uses keywords that ATS systems look for`;

    const userPrompt = `Target Role: ${targetRole}
Available Skills: ${skills.slice(0, 10).join(', ')}

Current Summary: "${currentSummary}"

Write an optimized professional summary for this target role. Return JSON:
{
    "fixed": "<optimized summary>",
    "explanation": "<what was improved>"
}

Return ONLY valid JSON.`;

    try {
        const response = await llmService.chat({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.6,
            maxTokens: 500,
            jsonMode: tier === 'openai'
        });

        const content = cleanJSON(response.content);

        const parsed = JSON.parse(content.trim());
        return {
            fixed: parsed.fixed || currentSummary,
            explanation: parsed.explanation || 'Summary optimized',
            tokenUsage: {
                totalTokens: response.usage?.totalTokens || 0,
                inputTokens: response.usage?.promptTokens || 0,
                outputTokens: response.usage?.completionTokens || 0,
                estimatedCost: response.usage?.cost || 0
            }
        };
    } catch {
        return {
            fixed: currentSummary,
            explanation: 'Could not optimize',
            tokenUsage: { totalTokens: 0, inputTokens: 0, outputTokens: 0, estimatedCost: 0 }
        };
    }
}

/**
 * Build a text representation of the resume for analysis
 */
function buildResumeContent(resume: Resume): string {
    const sections: string[] = [];

    // Header
    sections.push(`NAME: ${resume.header.name}`);
    sections.push(`TITLE: ${resume.header.title}`);

    // Summary
    sections.push(`\nSUMMARY:\n${resume.summary}`);

    // Skills
    const allSkills = (resume.skills.categories || [])
        .flatMap(cat => cat.items);
    sections.push(`\nSKILLS: ${allSkills.join(', ')}`);

    // Experience
    if (resume.experience.length > 0) {
        sections.push('\nEXPERIENCE:');
        resume.experience.forEach((exp, i) => {
            sections.push(`[${i}] ${exp.title} at ${exp.company} (${exp.startDate} - ${exp.current ? 'Present' : exp.endDate})`);
            exp.bullets.forEach((bullet, j) => {
                sections.push(`  bullet[${j}]: ${bullet}`);
            });
        });
    }

    // Projects
    if (resume.projects.length > 0) {
        sections.push('\nPROJECTS:');
        resume.projects.forEach((project, i) => {
            sections.push(`[${i}] ${project.name} - Technologies: ${project.technologies.join(', ')}`);
            sections.push(`  description: ${project.description}`);
            project.bullets.forEach((bullet, j) => {
                sections.push(`  bullet[${j}]: ${bullet}`);
            });
        });
    }

    // Education
    if (resume.education.length > 0) {
        sections.push('\nEDUCATION:');
        resume.education.forEach(edu => {
            sections.push(`${edu.degree} in ${edu.field} - ${edu.institution} (${edu.graduationDate})`);
        });
    }

    return sections.join('\n');
}

/**
 * Helper to clean LLM output and extract JSON
 */
function cleanJSON(text: string): string {
    // Remove markdown code blocks
    let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    // Locate the first { and last } to handle potential preamble/postscript
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    return cleaned;
}


