/**
 * Analysis Page
 * 
 * Shows the progress of GitHub profile analysis and then the generated resume
 */

'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
    Github,
    Loader2,
    CheckCircle2,
    XCircle,
    ArrowLeft,
    FileText,
    Sparkles,
    Clock,
    Coins
} from 'lucide-react';
import type { Resume } from '@/types';

interface AnalysisState {
    status: 'idle' | 'analyzing' | 'completed' | 'error';
    progress: number;
    message: string;
    resume?: Resume;
    error?: string;
    stats?: {
        repositoriesAnalyzed: number;
        tokenUsage: {
            totalTokens: number;
            estimatedCost: string;
        };
        timing: {
            durationSeconds: string;
        };
    };
}

function AnalyzeContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const username = searchParams.get('username');

    const [state, setState] = useState<AnalysisState>({
        status: 'idle',
        progress: 0,
        message: 'Preparing analysis...',
    });

    const runAnalysis = useCallback(async () => {
        if (!username) return;

        setState({
            status: 'analyzing',
            progress: 5,
            message: 'Connecting to GitHub...',
        });

        try {
            // Simulate progress updates while waiting for API
            const progressInterval = setInterval(() => {
                setState(prev => {
                    if (prev.status !== 'analyzing') return prev;
                    const newProgress = Math.min(prev.progress + Math.random() * 5, 90);
                    const messages = [
                        'Fetching profile data...',
                        'Analyzing repositories...',
                        'Reading code and documentation...',
                        'Extracting skills and achievements...',
                        'Generating resume content...',
                    ];
                    const messageIndex = Math.floor(newProgress / 20);
                    return {
                        ...prev,
                        progress: newProgress,
                        message: messages[messageIndex] || prev.message,
                    };
                });
            }, 2000);

            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
            });

            clearInterval(progressInterval);

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Analysis failed');
            }

            setState({
                status: 'completed',
                progress: 100,
                message: 'Resume generated successfully!',
                resume: data.data.resume,
                stats: {
                    repositoriesAnalyzed: data.data.repositoriesAnalyzed,
                    tokenUsage: data.data.tokenUsage,
                    timing: data.data.timing,
                },
            });
        } catch (error) {
            setState({
                status: 'error',
                progress: 0,
                message: 'Analysis failed',
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            });
        }
    }, [username]);

    useEffect(() => {
        if (username && state.status === 'idle') {
            runAnalysis();
        }
    }, [username, state.status, runAnalysis]);

    if (!username) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="max-w-md w-full text-center">
                    <CardContent className="pt-6">
                        <XCircle className="h-12 w-12 text-[hsl(var(--destructive))] mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">No Username Provided</h2>
                        <p className="text-[hsl(var(--muted-foreground))] mb-4">
                            Please enter a GitHub username to analyze.
                        </p>
                        <Button onClick={() => router.push('/')}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Go Back
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Analyzing GitHub Profile</h1>
                        <p className="text-[hsl(var(--muted-foreground))]">
                            <Github className="h-4 w-4 inline mr-1" />
                            {username}
                        </p>
                    </div>
                </div>

                {/* Analysis Progress */}
                {state.status === 'analyzing' && (
                    <Card className="mb-8">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center animate-pulse">
                                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold">{state.message}</h3>
                                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                                        This may take a minute depending on the number of repositories
                                    </p>
                                </div>
                            </div>
                            <Progress value={state.progress} showLabel />
                        </CardContent>
                    </Card>
                )}

                {/* Error State */}
                {state.status === 'error' && (
                    <Card className="mb-8 border-[hsl(var(--destructive))]">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <XCircle className="h-12 w-12 text-[hsl(var(--destructive))]" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-[hsl(var(--destructive))]">
                                        Analysis Failed
                                    </h3>
                                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                                        {state.error}
                                    </p>
                                </div>
                                <Button onClick={() => {
                                    setState({ status: 'idle', progress: 0, message: '' });
                                }}>
                                    Try Again
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Success State */}
                {state.status === 'completed' && state.resume && (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                            <Card>
                                <CardContent className="pt-4">
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-8 w-8 text-[hsl(var(--primary))]" />
                                        <div>
                                            <p className="text-2xl font-bold">{state.stats?.repositoriesAnalyzed}</p>
                                            <p className="text-sm text-[hsl(var(--muted-foreground))]">Repos Analyzed</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-4">
                                    <div className="flex items-center gap-3">
                                        <Clock className="h-8 w-8 text-[hsl(var(--primary))]" />
                                        <div>
                                            <p className="text-2xl font-bold">{state.stats?.timing.durationSeconds}s</p>
                                            <p className="text-sm text-[hsl(var(--muted-foreground))]">Total Time</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-4">
                                    <div className="flex items-center gap-3">
                                        <Coins className="h-8 w-8 text-[hsl(var(--primary))]" />
                                        <div>
                                            <p className="text-2xl font-bold">${state.stats?.tokenUsage.estimatedCost}</p>
                                            <p className="text-sm text-[hsl(var(--muted-foreground))]">AI Cost</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Resume Preview */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                                        Resume Generated!
                                    </CardTitle>
                                    <Button
                                        variant="gradient"
                                        onClick={() => {
                                            // Save to localStorage and navigate to editor
                                            localStorage.setItem('generated_resume', JSON.stringify(state.resume));
                                            router.push(`/resume/${state.resume?.id}`);
                                        }}
                                    >
                                        <Sparkles className="h-4 w-4" />
                                        View & Edit Resume
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {/* Header Preview */}
                                    <div>
                                        <h2 className="text-3xl font-bold">{state.resume.header.name}</h2>
                                        <p className="text-lg text-[hsl(var(--primary))]">{state.resume.header.title}</p>
                                    </div>

                                    {/* Summary */}
                                    <div>
                                        <h3 className="font-semibold mb-2">Summary</h3>
                                        <p className="text-[hsl(var(--muted-foreground))]">{state.resume.summary}</p>
                                    </div>

                                    {/* Skills */}
                                    <div>
                                        <h3 className="font-semibold mb-2">Skills</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                ...state.resume.skills.languages,
                                                ...state.resume.skills.frameworks,
                                                ...state.resume.skills.tools,
                                            ].slice(0, 15).map((skill, i) => (
                                                <Badge key={i} variant="secondary">{skill}</Badge>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Projects Preview */}
                                    <div>
                                        <h3 className="font-semibold mb-2">Projects ({state.resume.projects.length})</h3>
                                        <div className="space-y-4">
                                            {state.resume.projects.slice(0, 3).map((project, i) => (
                                                <div key={i} className="p-4 rounded-lg bg-[hsl(var(--muted))]">
                                                    <h4 className="font-medium">{project.name}</h4>
                                                    <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">
                                                        {project.description}
                                                    </p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {project.technologies.map((tech, j) => (
                                                            <Badge key={j} variant="outline" className="text-xs">{tech}</Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                            {state.resume.projects.length > 3 && (
                                                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                                                    +{state.resume.projects.length - 3} more projects
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </div>
    );
}

export default function AnalyzePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
            </div>
        }>
            <AnalyzeContent />
        </Suspense>
    );
}
