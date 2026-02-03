/**
 * ATS Score Modal Component
 * 
 * Displays detailed ATS score breakdown with suggestions
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
} from 'lucide-react';
import type { Resume } from '@/types';
import type { ATSScore } from '@/lib/ats-scorer';

interface ATSScoreModalProps {
    resume: Resume;
    targetRole?: string;
    onClose: () => void;
}

function ScoreCircle({ score, size = 'lg' }: { score: number; size?: 'sm' | 'lg' }) {
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
                    {/* Background circle */}
                    <circle
                        cx={radius + strokeWidth}
                        cy={radius + strokeWidth}
                        r={radius}
                        fill="none"
                        className="stroke-[hsl(var(--muted))]"
                        strokeWidth={strokeWidth}
                    />
                    {/* Progress circle */}
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
                    {getLabel()}
                </span>
            )}
        </div>
    );
}

function SuggestionCard({
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
                                {expanded ? 'Hide fix' : 'Show fix'}
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

export function ATSScoreModal({ resume, targetRole, onClose }: ATSScoreModalProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [score, setScore] = useState<ATSScore | null>(null);
    const [usage, setUsage] = useState<{ remaining: number; limit: number } | null>(null);
    const [showUpgrade, setShowUpgrade] = useState(false);

    useEffect(() => {
        const fetchScore = async () => {
            try {
                const response = await fetch('/api/ats-check', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ resume, targetRole }),
                });

                const data = await response.json();

                if (!response.ok) {
                    if (data.upgradeRequired) {
                        setShowUpgrade(true);
                    }
                    throw new Error(data.message || data.error || 'Failed to check score');
                }

                setScore(data.data.score);
                setUsage(data.data.usage);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        fetchScore();
    }, [resume, targetRole]);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-hidden">
                <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            ATS Score Check
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
                            <p>Analyzing your resume...</p>
                        </div>
                    )}

                    {showUpgrade && (
                        <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                            <Crown className="h-12 w-12 text-amber-500" />
                            <h3 className="text-xl font-bold">Free Tier Limit Reached</h3>
                            <p className="text-[hsl(var(--muted-foreground))] max-w-md">
                                You&apos;ve used all 3 free ATS checks for today.
                                Upgrade to Premium for unlimited checks and more features!
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

                    {score && !loading && (
                        <div className="space-y-6">
                            {/* Overall Score */}
                            <div className="flex items-center justify-center">
                                <ScoreCircle score={score.overall} size="lg" />
                            </div>

                            {/* Usage Info */}
                            {usage && (
                                <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
                                    {usage.remaining} of {usage.limit} free checks remaining today
                                </p>
                            )}

                            {/* Score Breakdown */}
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

                            {/* Keywords Found */}
                            {score.keywordAnalysis.found.length > 0 && (
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

                            {/* Suggestions */}
                            {score.suggestions.length > 0 && (
                                <div>
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4" />
                                        Improvement Suggestions
                                    </h4>
                                    <div className="space-y-3">
                                        {score.suggestions.map((suggestion, i) => (
                                            <SuggestionCard
                                                key={i}
                                                category={suggestion.category}
                                                message={suggestion.message}
                                                fix={suggestion.fix}
                                            />
                                        ))}
                                    </div>
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
