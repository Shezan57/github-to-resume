/**
 * Keyword Suggestions Panel
 * 
 * Shows ATS-optimized keyword suggestions based on target role
 */

'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Lightbulb,
    Check,
    Copy,
    Target,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import type { Resume } from '@/types';
import { ROLE_KEYWORDS } from '@/lib/llm/prompts';

interface KeywordSuggestionsProps {
    resume: Resume;
    targetRole?: string;
}

// General ATS keywords that apply to most tech roles
const GENERAL_KEYWORDS = [
    'Developed', 'Implemented', 'Designed', 'Built', 'Created',
    'Optimized', 'Improved', 'Reduced', 'Increased', 'Managed',
    'Collaborated', 'Led', 'Delivered', 'Automated', 'Integrated',
    'Deployed', 'Tested', 'Debugged', 'Refactored', 'Maintained',
    'Scalable', 'Performance', 'API', 'Database', 'Cloud',
];

export function KeywordSuggestions({ resume, targetRole }: KeywordSuggestionsProps) {
    const [expanded, setExpanded] = useState(true);
    const [copiedKeyword, setCopiedKeyword] = useState<string | null>(null);

    // Get all text content from resume
    const resumeText = useMemo(() => {
        const parts = [
            resume.summary,
            ...resume.projects.flatMap(p => [p.description, ...p.bullets]),
            ...resume.experience.flatMap(e => e.bullets),
            ...resume.skills.languages,
            ...resume.skills.frameworks,
            ...resume.skills.tools,
        ];
        return parts.join(' ').toLowerCase();
    }, [resume]);

    // Get role-specific keywords
    const roleKeywords = useMemo(() => {
        if (targetRole && ROLE_KEYWORDS[targetRole]) {
            return ROLE_KEYWORDS[targetRole];
        }
        return GENERAL_KEYWORDS;
    }, [targetRole]);

    // Analyze which keywords are present/missing
    const analysis = useMemo(() => {
        const found: string[] = [];
        const missing: string[] = [];

        roleKeywords.forEach(keyword => {
            if (resumeText.includes(keyword.toLowerCase())) {
                found.push(keyword);
            } else {
                missing.push(keyword);
            }
        });

        return { found, missing };
    }, [resumeText, roleKeywords]);

    const handleCopy = async (keyword: string) => {
        await navigator.clipboard.writeText(keyword);
        setCopiedKeyword(keyword);
        setTimeout(() => setCopiedKeyword(null), 1500);
    };

    const score = Math.round((analysis.found.length / roleKeywords.length) * 100);

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-[hsl(var(--primary))]" />
                        Keywords
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Badge
                            variant={score >= 70 ? 'default' : score >= 50 ? 'secondary' : 'destructive'}
                            className="text-xs"
                        >
                            {score}%
                        </Badge>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => setExpanded(!expanded)}
                        >
                            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            </CardHeader>

            {expanded && (
                <CardContent className="space-y-3">
                    {targetRole && (
                        <div className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
                            <Target className="h-3 w-3" />
                            Optimized for: <span className="capitalize font-medium">{targetRole.replace(/-/g, ' ')}</span>
                        </div>
                    )}

                    {/* Found Keywords */}
                    {analysis.found.length > 0 && (
                        <div>
                            <p className="text-xs font-medium text-emerald-600 mb-1 flex items-center gap-1">
                                <Check className="h-3 w-3" />
                                Found ({analysis.found.length})
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {analysis.found.slice(0, 8).map(keyword => (
                                    <Badge key={keyword} variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                                        {keyword}
                                    </Badge>
                                ))}
                                {analysis.found.length > 8 && (
                                    <Badge variant="outline" className="text-xs">
                                        +{analysis.found.length - 8}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Missing Keywords - click to copy */}
                    {analysis.missing.length > 0 && (
                        <div>
                            <p className="text-xs font-medium text-amber-600 mb-1">
                                Suggested ({analysis.missing.length})
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {analysis.missing.slice(0, 10).map(keyword => (
                                    <button
                                        key={keyword}
                                        onClick={() => handleCopy(keyword)}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                                    >
                                        {copiedKeyword === keyword ? (
                                            <>
                                                <Check className="h-2.5 w-2.5" />
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="h-2.5 w-2.5" />
                                                {keyword}
                                            </>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        Click suggested keywords to copy
                    </p>
                </CardContent>
            )}
        </Card>
    );
}

export default KeywordSuggestions;
