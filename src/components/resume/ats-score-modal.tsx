/**
 * ATS Score Modal Component
 * 
 * Displays detailed ATS score breakdown with AI-powered suggestions and fixes
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    XCircle,
    CheckCircle2,
    AlertTriangle,
    AlertCircle,
    Loader2,
    TrendingUp,
    Target,
    Sparkles,
    Crown,
    ChevronDown,
    ChevronUp,
    Wand2,
    Zap,
    Brain,
    Check,
    Copy,
    RefreshCw,
} from 'lucide-react';
import type { Resume } from '@/types';
import type { ATSScore } from '@/lib/ats-scorer';
import type { LLMATSResult, LLMSuggestion } from '@/lib/llm/ats-analyzer';

import { deepClone } from '@/lib/utils';
import { useUsage } from '@/contexts/usage-context';
import { LLMProvider } from '@/lib/llm/types';

interface ATSScoreModalProps {
    resume: Resume;
    targetRole?: string;
    onClose: () => void;
    onApplyFix?: (path: string, value: string) => void;
    tier?: LLMProvider;
}

function ScoreCircle({ score, size = 'lg', label }: { score: number; size?: 'sm' | 'lg'; label?: string }) {
    const getColor = () => {
        if (score >= 80) return 'stroke-emerald-500';
        if (score >= 60) return 'stroke-amber-500';
        return 'stroke-red-500';
    };

    const getLabel = () => {
        if (score >= 90) return 'Excellent';
        if (score >= 80) return 'Very Good';
        if (score >= 70) return 'Good';
        if (score >= 60) return 'Fair';
        if (score >= 50) return 'Needs Work';
        return 'Poor';
    };

    const radius = size === 'lg' ? 60 : 30;
    const strokeWidth = size === 'lg' ? 8 : 4;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative">
                <svg
                    className={`transform -rotate-90 ${size === 'lg' ? 'w-36 h-36' : 'w-20 h-20'}`}
                    viewBox={`0 0 ${radius * 2 + strokeWidth * 2} ${radius * 2 + strokeWidth * 2}`}
                >
                    <circle
                        cx={radius + strokeWidth}
                        cy={radius + strokeWidth}
                        r={radius}
                        fill="none"
                        className="stroke-[hsl(var(--muted))]"
                        strokeWidth={strokeWidth}
                    />
                    <circle
                        cx={radius + strokeWidth}
                        cy={radius + strokeWidth}
                        r={radius}
                        fill="none"
                        className={getColor()}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`${size === 'lg' ? 'text-4xl' : 'text-xl'} font-bold`}>
                        {score}
                    </span>
                </div>
            </div>
            {size === 'lg' && (
                <span className={`text-lg font-medium ${getColor().replace('stroke-', 'text-')}`}>
                    {label || getLabel()}
                </span>
            )}
        </div>
    );
}

function AISuggestionCard({
    suggestion,
    onFix,
    isFixing,
}: {
    suggestion: LLMSuggestion;
    onFix?: (suggestion: LLMSuggestion) => void;
    isFixing?: boolean;
}) {
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    const styles = {
        critical: {
            border: 'border-red-500/30',
            bg: 'bg-red-500/5',
            icon: <AlertCircle className="h-4 w-4 text-red-500" />,
            badge: <Badge variant="destructive" className="text-xs">Critical</Badge>,
        },
        important: {
            border: 'border-amber-500/30',
            bg: 'bg-amber-500/5',
            icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
            badge: <Badge className="text-xs bg-amber-500">Important</Badge>,
        },
        minor: {
            border: 'border-blue-500/30',
            bg: 'bg-blue-500/5',
            icon: <Sparkles className="h-4 w-4 text-blue-500" />,
            badge: <Badge variant="secondary" className="text-xs">Suggestion</Badge>,
        },
    };

    const style = styles[suggestion.severity];

    const handleCopy = async () => {
        if (suggestion.fixedText) {
            await navigator.clipboard.writeText(suggestion.fixedText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className={`p-3 rounded-lg border ${style.border} ${style.bg}`}>
            <div className="flex items-start gap-3">
                {style.icon}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {style.badge}
                        <Badge variant="outline" className="text-xs capitalize">
                            {suggestion.category}
                        </Badge>
                        {suggestion.location && (
                            <span className="text-xs text-[hsl(var(--muted-foreground))]">
                                in {suggestion.location}
                            </span>
                        )}
                    </div>
                    <p className="text-sm font-medium">{suggestion.issue}</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                        {suggestion.suggestion}
                    </p>

                    {suggestion.fixedText && (
                        <>
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className="text-xs text-[hsl(var(--primary))] flex items-center gap-1 mt-2"
                            >
                                {expanded ? 'Hide AI fix' : 'Show AI fix'}
                                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </button>
                            {expanded && (
                                <div className="mt-2 space-y-2">
                                    {suggestion.originalText && (
                                        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs">
                                            <span className="font-medium text-red-600 dark:text-red-400">Before: </span>
                                            <span className="text-red-700 dark:text-red-300">{suggestion.originalText}</span>
                                        </div>
                                    )}
                                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded text-xs">
                                        <span className="font-medium text-emerald-600 dark:text-emerald-400">After: </span>
                                        <span className="text-emerald-700 dark:text-emerald-300">{suggestion.fixedText}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-xs"
                                            onClick={handleCopy}
                                        >
                                            {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                                            {copied ? 'Copied!' : 'Copy'}
                                        </Button>
                                        {onFix && (
                                            <Button
                                                size="sm"
                                                className="h-7 text-xs"
                                                onClick={() => onFix(suggestion)}
                                                disabled={isFixing}
                                            >
                                                {isFixing ? (
                                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                ) : (
                                                    <Wand2 className="h-3 w-3 mr-1" />
                                                )}
                                                Apply Fix
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function RuleSuggestionCard({
    category,
    message,
    fix,
}: {
    category: 'critical' | 'important' | 'minor';
    message: string;
    fix?: string;
}) {
    const [expanded, setExpanded] = useState(false);

    const styles = {
        critical: {
            border: 'border-red-500/30',
            bg: 'bg-red-500/5',
            icon: <AlertCircle className="h-4 w-4 text-red-500" />,
            badge: <Badge variant="destructive" className="text-xs">Critical</Badge>,
        },
        important: {
            border: 'border-amber-500/30',
            bg: 'bg-amber-500/5',
            icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
            badge: <Badge className="text-xs bg-amber-500">Important</Badge>,
        },
        minor: {
            border: 'border-blue-500/30',
            bg: 'bg-blue-500/5',
            icon: <Sparkles className="h-4 w-4 text-blue-500" />,
            badge: <Badge variant="secondary" className="text-xs">Suggestion</Badge>,
        },
    };

    const style = styles[category];

    return (
        <div className={`p-3 rounded-lg border ${style.border} ${style.bg}`}>
            <div className="flex items-start gap-3">
                {style.icon}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        {style.badge}
                    </div>
                    <p className="text-sm">{message}</p>
                    {fix && (
                        <>
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className="text-xs text-[hsl(var(--primary))] flex items-center gap-1 mt-2"
                            >
                                {expanded ? 'Hide tip' : 'Show tip'}
                                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </button>
                            {expanded && (
                                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2 p-2 bg-[hsl(var(--muted))] rounded">
                                    💡 {fix}
                                </p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export function ATSScoreModal({ resume, targetRole, onClose, onApplyFix, tier }: ATSScoreModalProps) {
    const [mode, setMode] = useState<'quick' | 'ai'>('quick');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [score, setScore] = useState<ATSScore | null>(null);
    const [aiResult, setAiResult] = useState<LLMATSResult | null>(null);
    const [usage, setUsage] = useState<{ remaining: number; limit: number } | null>(null);
    const [showUpgrade, setShowUpgrade] = useState(false);
    const [fixingId, setFixingId] = useState<string | null>(null);

    const { incrementATSCheck, hasReachedATSLimit, setShowRegistrationWall } = useUsage();

    const fetchScore = async (analysisMode: 'quick' | 'ai') => {
        // Only check limit for AI analysis if requesting AI mode
        if (analysisMode === 'ai' && hasReachedATSLimit) {
            setShowRegistrationWall(true);
            return;
        }

        setLoading(true);
        setError(null);
        setShowUpgrade(false);

        try {
            const response = await fetch('/api/ats-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resume, targetRole, mode: analysisMode, tier }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.upgradeRequired) {
                    setShowUpgrade(true);
                }
                throw new Error(data.message || data.error || 'Failed to check score');
            }

            setScore(data.data.score);
            if (data.data.aiResult) {
                setAiResult(deepClone(data.data.aiResult));
                // Increment usage only for AI analysis success
                incrementATSCheck();
            }
            setUsage(data.data.usage);
            setMode(analysisMode);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchScore('quick');
    }, [resume, targetRole]);

    const handleAIAnalysis = () => {
        fetchScore('ai');
    };

    const handleApplyFix = async (suggestion: LLMSuggestion) => {
        if (!onApplyFix || !suggestion.fixedText || !suggestion.location) return;

        setFixingId(suggestion.id);
        try {
            // Parse location and apply fix
            // Location format: "summary", "project:0:description", "project:0:bullet:1", etc.
            onApplyFix(suggestion.location, suggestion.fixedText);
        } finally {
            setFixingId(null);
        }
    };

    const displayScore = mode === 'ai' && aiResult ? aiResult.overallScore : score?.overall || 0;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-hidden">
                <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            ATS Score Check
                            {mode === 'ai' && (
                                <Badge className="ml-2 bg-gradient-to-r from-purple-500 to-pink-500">
                                    <Brain className="h-3 w-3 mr-1" />
                                    AI Powered
                                </Badge>
                            )}
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <XCircle className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="overflow-y-auto max-h-[calc(90vh-80px)] pt-6">
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
                            <p>{mode === 'ai' ? 'AI is analyzing your resume...' : 'Analyzing your resume...'}</p>
                        </div>
                    )}

                    {showUpgrade && (
                        <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                            <Crown className="h-12 w-12 text-amber-500" />
                            <h3 className="text-xl font-bold">Free Tier Limit Reached</h3>
                            <p className="text-[hsl(var(--muted-foreground))] max-w-md">
                                You&apos;ve used all {usage?.limit || 10} free AI checks for today.
                            </p>
                            <div className="flex gap-3 mt-4">
                                <Button variant="outline" onClick={onClose}>
                                    Maybe Later
                                </Button>
                                <Button variant="gradient">
                                    <Crown className="h-4 w-4 mr-1" />
                                    Upgrade to Premium
                                </Button>
                            </div>
                        </div>
                    )}

                    {error && !showUpgrade && (
                        <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                            <XCircle className="h-12 w-12 text-red-500" />
                            <p className="text-[hsl(var(--destructive))]">{error}</p>
                            <Button variant="outline" onClick={onClose}>
                                Close
                            </Button>
                        </div>
                    )}

                    {!loading && !error && !showUpgrade && (
                        <div className="space-y-6">
                            {/* Overall Score */}
                            <div className="flex items-center justify-center">
                                <ScoreCircle score={displayScore} size="lg" />
                            </div>

                            {/* Mode Toggle & Reanalyze */}
                            <div className="flex justify-center gap-2">
                                {mode === 'quick' && (
                                    <Button
                                        onClick={handleAIAnalysis}
                                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                                    >
                                        <Brain className="h-4 w-4 mr-2" />
                                        Analyze with AI
                                    </Button>
                                )}
                                {mode === 'ai' && (
                                    <Button variant="outline" onClick={() => fetchScore('ai')}>
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Re-analyze
                                    </Button>
                                )}
                            </div>

                            {/* Usage Info */}
                            {usage && (
                                <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
                                    {usage.remaining} of {usage.limit} free AI checks remaining today
                                </p>
                            )}

                            {/* AI Result - Strengths */}
                            {mode === 'ai' && aiResult && aiResult.strengths.length > 0 && (
                                <div>
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        Strengths
                                    </h4>
                                    <div className="space-y-1">
                                        {aiResult.strengths.map((strength, i) => (
                                            <p key={i} className="text-sm text-[hsl(var(--muted-foreground))] flex items-start gap-2">
                                                <span className="text-emerald-500">✓</span>
                                                {strength}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Score Breakdown */}
                            <div>
                                <h4 className="font-semibold mb-3">Score Breakdown</h4>
                                {mode === 'ai' && aiResult ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {Object.entries(aiResult.breakdown).map(([key, data]) => (
                                            <div
                                                key={key}
                                                className="p-3 rounded-lg bg-[hsl(var(--muted))]"
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="text-xs text-[hsl(var(--muted-foreground))] capitalize">
                                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                                    </p>
                                                    <span className="text-lg font-bold">{data.score}</span>
                                                </div>
                                                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                                    {data.feedback}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : score && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {Object.entries(score.breakdown).map(([key, value]) => (
                                            <div
                                                key={key}
                                                className="p-3 rounded-lg bg-[hsl(var(--muted))] text-center"
                                            >
                                                <p className="text-2xl font-bold">{value}</p>
                                                <p className="text-xs text-[hsl(var(--muted-foreground))] capitalize">
                                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Keywords Found (Quick mode) */}
                            {mode === 'quick' && score && score.keywordAnalysis.found.length > 0 && (
                                <div>
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        Keywords Found ({score.keywordAnalysis.found.length})
                                    </h4>
                                    <div className="flex flex-wrap gap-1">
                                        {score.keywordAnalysis.found.slice(0, 15).map((k, i) => (
                                            <Badge key={i} variant="secondary" className="text-xs">
                                                {k}
                                            </Badge>
                                        ))}
                                        {score.keywordAnalysis.found.length > 15 && (
                                            <Badge variant="secondary" className="text-xs">
                                                +{score.keywordAnalysis.found.length - 15} more
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* AI Suggestions */}
                            {mode === 'ai' && aiResult && aiResult.suggestions.length > 0 && (
                                <div>
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <Wand2 className="h-4 w-4 text-purple-500" />
                                        AI Suggestions ({aiResult.suggestions.length})
                                    </h4>
                                    <div className="space-y-3">
                                        {aiResult.suggestions.map((suggestion) => (
                                            <AISuggestionCard
                                                key={suggestion.id}
                                                suggestion={suggestion}
                                                onFix={onApplyFix ? handleApplyFix : undefined}
                                                isFixing={fixingId === suggestion.id}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quick Mode Suggestions */}
                            {mode === 'quick' && score && score.suggestions.length > 0 && (
                                <div>
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4" />
                                        Improvement Suggestions
                                        <Badge variant="outline" className="text-xs ml-2">
                                            <Zap className="h-3 w-3 mr-1" />
                                            Quick Analysis
                                        </Badge>
                                    </h4>
                                    <div className="space-y-3">
                                        {score.suggestions.map((suggestion, i) => (
                                            <RuleSuggestionCard
                                                key={i}
                                                category={suggestion.category}
                                                message={suggestion.message}
                                                fix={suggestion.fix}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-3 text-center">
                                        💡 Use <strong>Analyze with AI</strong> for more accurate analysis and auto-fix suggestions
                                    </p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex justify-center gap-3 pt-4">
                                <Button variant="outline" onClick={onClose}>
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default ATSScoreModal;
