/**
 * ATS Score Checker
 * 
 * Analyzes resume content for ATS (Applicant Tracking System) compatibility
 * and provides a score with improvement suggestions
 */

import type { Resume } from '@/types';

export interface ATSScore {
    overall: number; // 0-100
    breakdown: {
        keywords: number;      // Presence of relevant keywords
        formatting: number;    // Proper formatting
        quantification: number; // Numbers and metrics
        actionVerbs: number;   // Strong action verbs
        length: number;        // Appropriate length
        clarity: number;       // Clear, concise writing
    };
    suggestions: ATSSuggestion[];
    keywordAnalysis: KeywordAnalysis;
}

export interface ATSSuggestion {
    category: 'critical' | 'important' | 'minor';
    message: string;
    fix?: string;
}

export interface KeywordAnalysis {
    found: string[];
    missing: string[];
    overused: string[];
}

// Common ATS keywords by category
const COMMON_KEYWORDS = {
    technical: [
        'developed', 'implemented', 'designed', 'built', 'created',
        'optimized', 'automated', 'integrated', 'deployed', 'maintained',
        'architected', 'engineered', 'programmed', 'configured', 'administered',
    ],
    impact: [
        'increased', 'decreased', 'reduced', 'improved', 'enhanced',
        'accelerated', 'streamlined', 'saved', 'generated', 'achieved',
    ],
    leadership: [
        'led', 'managed', 'coordinated', 'mentored', 'supervised',
        'directed', 'organized', 'collaborated', 'trained', 'facilitated',
    ],
    analytical: [
        'analyzed', 'evaluated', 'assessed', 'researched', 'investigated',
        'identified', 'solved', 'diagnosed', 'troubleshooted', 'resolved',
    ],
};

// Strong action verbs for ATS
const STRONG_ACTION_VERBS = [
    'achieved', 'administered', 'analyzed', 'architected', 'automated',
    'built', 'collaborated', 'configured', 'created', 'delivered',
    'deployed', 'designed', 'developed', 'documented', 'engineered',
    'established', 'executed', 'generated', 'implemented', 'improved',
    'increased', 'integrated', 'launched', 'led', 'maintained',
    'managed', 'mentored', 'migrated', 'modernized', 'optimized',
    'orchestrated', 'pioneered', 'reduced', 'refactored', 'resolved',
    'scaled', 'secured', 'spearheaded', 'streamlined', 'transformed',
];

// Words to avoid in ATS resumes
const WEAK_WORDS = [
    'helped', 'assisted', 'worked on', 'responsible for', 'duties included',
    'participated in', 'was involved', 'supported', 'contributed to',
];

/**
 * Analyze resume for ATS compatibility
 */
export function analyzeATSScore(resume: Resume, targetRole?: string): ATSScore {
    const suggestions: ATSSuggestion[] = [];

    // Collect all text content
    const allBullets = resume.projects.flatMap(p => p.bullets);
    const allText = [
        resume.summary,
        ...allBullets,
        ...resume.projects.map(p => p.description),
    ].join(' ').toLowerCase();

    // 1. Keyword Analysis
    const keywordScore = analyzeKeywords(allText, allBullets, suggestions);

    // 2. Formatting Score
    const formattingScore = analyzeFormatting(resume, suggestions);

    // 3. Quantification Score
    const quantificationScore = analyzeQuantification(allBullets, suggestions);

    // 4. Action Verbs Score
    const actionVerbScore = analyzeActionVerbs(allBullets, suggestions);

    // 5. Length Score
    const lengthScore = analyzeLength(resume, suggestions);

    // 6. Clarity Score
    const clarityScore = analyzeClarity(allBullets, suggestions);

    // Calculate overall score (weighted average)
    const overall = Math.round(
        (keywordScore.score * 0.25) +
        (formattingScore * 0.15) +
        (quantificationScore * 0.20) +
        (actionVerbScore * 0.20) +
        (lengthScore * 0.10) +
        (clarityScore * 0.10)
    );

    // Sort suggestions by priority
    suggestions.sort((a, b) => {
        const priority = { critical: 0, important: 1, minor: 2 };
        return priority[a.category] - priority[b.category];
    });

    return {
        overall,
        breakdown: {
            keywords: keywordScore.score,
            formatting: formattingScore,
            quantification: quantificationScore,
            actionVerbs: actionVerbScore,
            length: lengthScore,
            clarity: clarityScore,
        },
        suggestions: suggestions.slice(0, 10), // Limit to top 10
        keywordAnalysis: keywordScore.analysis,
    };
}

function analyzeKeywords(
    allText: string,
    bullets: string[],
    suggestions: ATSSuggestion[]
): { score: number; analysis: KeywordAnalysis } {
    const found: string[] = [];
    const missing: string[] = [];
    const overused: string[] = [];

    // Check for common keywords
    const allKeywords = [
        ...COMMON_KEYWORDS.technical,
        ...COMMON_KEYWORDS.impact,
        ...COMMON_KEYWORDS.leadership,
        ...COMMON_KEYWORDS.analytical,
    ];

    for (const keyword of allKeywords) {
        const count = (allText.match(new RegExp(keyword, 'gi')) || []).length;
        if (count > 0) {
            found.push(keyword);
            if (count > 5) {
                overused.push(keyword);
            }
        }
    }

    // Check for missing important keywords
    const importantKeywords = ['developed', 'implemented', 'designed', 'improved', 'led'];
    for (const keyword of importantKeywords) {
        if (!allText.includes(keyword)) {
            missing.push(keyword);
        }
    }

    // Calculate score
    const score = Math.min(100, Math.round((found.length / 15) * 100));

    if (missing.length > 3) {
        suggestions.push({
            category: 'important',
            message: `Missing key action verbs: ${missing.slice(0, 3).join(', ')}`,
            fix: 'Use strong action verbs like "developed", "implemented", "designed"',
        });
    }

    if (overused.length > 0) {
        suggestions.push({
            category: 'minor',
            message: `Some words are overused: ${overused.join(', ')}`,
            fix: 'Use synonyms to add variety',
        });
    }

    return {
        score,
        analysis: { found, missing, overused },
    };
}

function analyzeFormatting(resume: Resume, suggestions: ATSSuggestion[]): number {
    let score = 100;

    // Check for essential sections
    if (!resume.summary || resume.summary.length < 50) {
        score -= 20;
        suggestions.push({
            category: 'critical',
            message: 'Professional summary is too short or missing',
            fix: 'Add a 2-3 sentence summary highlighting your key strengths',
        });
    }

    // Check for skills count
    const totalSkills = (resume.skills.categories || []).reduce((sum, cat) => sum + cat.items.length, 0);
    if (totalSkills < 5) {
        score -= 10;
        suggestions.push({
            category: 'important',
            message: 'Add more skills to your resume',
        });
    }

    if (resume.projects.length < 3) {
        score -= 15;
        suggestions.push({
            category: 'important',
            message: 'Include at least 3-4 projects for a stronger resume',
        });
    }

    // Check header completeness
    if (!resume.header.email) {
        score -= 10;
        suggestions.push({
            category: 'critical',
            message: 'Email is missing from contact information',
        });
    }

    return Math.max(0, score);
}

function analyzeQuantification(bullets: string[], suggestions: ATSSuggestion[]): number {
    let quantifiedCount = 0;

    // Check for numbers, percentages, metrics
    const quantifierPattern = /\d+%?|\$[\d,]+|[\d,]+\+?\s*(users?|customers?|requests?|servers?|ms|seconds?)/i;

    for (const bullet of bullets) {
        if (quantifierPattern.test(bullet)) {
            quantifiedCount++;
        }
    }

    const ratio = bullets.length > 0 ? quantifiedCount / bullets.length : 0;
    const score = Math.min(100, Math.round(ratio * 200)); // Aim for 50% quantified

    if (ratio < 0.3) {
        suggestions.push({
            category: 'critical',
            message: `Only ${Math.round(ratio * 100)}% of bullet points have metrics`,
            fix: 'Add numbers: users served, performance improvement %, time saved, etc.',
        });
    }

    return score;
}

function analyzeActionVerbs(bullets: string[], suggestions: ATSSuggestion[]): number {
    let strongVerbCount = 0;
    let weakVerbCount = 0;

    for (const bullet of bullets) {
        const firstWord = bullet.trim().split(/\s+/)[0]?.toLowerCase() || '';

        if (STRONG_ACTION_VERBS.includes(firstWord)) {
            strongVerbCount++;
        }

        for (const weak of WEAK_WORDS) {
            if (bullet.toLowerCase().startsWith(weak)) {
                weakVerbCount++;
                break;
            }
        }
    }

    const ratio = bullets.length > 0 ? strongVerbCount / bullets.length : 0;
    const score = Math.min(100, Math.round(ratio * 125)); // 80% target

    if (weakVerbCount > 0) {
        suggestions.push({
            category: 'important',
            message: `${weakVerbCount} bullet point(s) use weak language`,
            fix: 'Replace "helped", "assisted", "worked on" with strong action verbs',
        });
    }

    if (ratio < 0.5) {
        suggestions.push({
            category: 'important',
            message: 'Start more bullet points with strong action verbs',
            fix: 'Use: Developed, Implemented, Architected, Optimized, Led',
        });
    }

    return score;
}

function analyzeLength(resume: Resume, suggestions: ATSSuggestion[]): number {
    let score = 100;

    // Check bullet point length
    const allBullets = resume.projects.flatMap(p => p.bullets);
    const longBullets = allBullets.filter(b => b.length > 150);
    const shortBullets = allBullets.filter(b => b.length < 30);

    if (longBullets.length > allBullets.length * 0.3) {
        score -= 20;
        suggestions.push({
            category: 'minor',
            message: 'Some bullet points are too long',
            fix: 'Keep bullet points to 1-2 lines (under 150 characters)',
        });
    }

    if (shortBullets.length > allBullets.length * 0.3) {
        score -= 15;
        suggestions.push({
            category: 'minor',
            message: 'Some bullet points are too short',
            fix: 'Add more detail about impact and technologies used',
        });
    }

    // Check summary length
    if (resume.summary && resume.summary.length > 500) {
        score -= 10;
        suggestions.push({
            category: 'minor',
            message: 'Professional summary is too long',
            fix: 'Keep summary to 2-3 sentences (under 300 characters)',
        });
    }

    return Math.max(0, score);
}

function analyzeClarity(bullets: string[], suggestions: ATSSuggestion[]): number {
    let score = 100;
    let jargonCount = 0;

    // Check for unclear acronyms (all caps words that aren't common)
    const commonAcronyms = ['API', 'REST', 'SQL', 'HTML', 'CSS', 'AWS', 'GCP', 'CI', 'CD', 'UI', 'UX'];

    for (const bullet of bullets) {
        const words = bullet.match(/\b[A-Z]{2,}\b/g) || [];
        for (const word of words) {
            if (!commonAcronyms.includes(word)) {
                jargonCount++;
            }
        }
    }

    if (jargonCount > 5) {
        score -= 15;
        suggestions.push({
            category: 'minor',
            message: 'Consider expanding uncommon acronyms',
            fix: 'Spell out acronyms on first use for clarity',
        });
    }

    return Math.max(0, score);
}

/**
 * Get score color based on value
 */
export function getScoreColor(score: number): string {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
}

/**
 * Get score label based on value
 */
export function getScoreLabel(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 50) return 'Needs Work';
    return 'Poor';
}
