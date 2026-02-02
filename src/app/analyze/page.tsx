/**
 * Analysis Page
 * 
 * New flow:
 * 1. Fetch repos list (lightweight)
 * 2. Show repo selection UI
 * 3. Analyze only selected repos
 * 4. Show generated resume
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
    Coins,
    Star,
    GitFork,
    Check,
    AlertCircle,
} from 'lucide-react';
import type { Resume } from '@/types';

interface RepoInfo {
    id: number;
    name: string;
    fullName: string;
    description: string | null;
    url: string;
    language: string | null;
    stars: number;
    forks: number;
    topics: string[];
    pushedAt: string;
    isFork: boolean;
    isArchived: boolean;
    score: number;
}

interface UserInfo {
    username: string;
    name: string | null;
    avatarUrl: string;
    bio: string | null;
    publicRepos: number;
}

type PageStep = 'loading' | 'select' | 'analyzing' | 'completed' | 'error';

interface PageState {
    step: PageStep;
    user?: UserInfo;
    repos?: RepoInfo[];
    selectedRepos: Set<string>;
    suggestedRepos?: string[];
    progress: number;
    message: string;
    resume?: Resume;
    error?: string;
    stats?: {
        repositoriesAnalyzed: number;
        tokenUsage: { totalTokens: number; estimatedCost: string };
        timing: { durationSeconds: string };
    };
}

function AnalyzeContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const username = searchParams.get('username');

    const [state, setState] = useState<PageState>({
        step: 'loading',
        selectedRepos: new Set(),
        progress: 0,
        message: 'Loading repositories...',
    });

    // Fetch repos on mount
    useEffect(() => {
        if (!username) return;

        const fetchRepos = async () => {
            try {
                const response = await fetch(`/api/repos?username=${encodeURIComponent(username)}`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch repositories');
                }

                setState({
                    step: 'select',
                    user: data.data.user,
                    repos: data.data.repos,
                    selectedRepos: new Set(data.data.suggested || []),
                    suggestedRepos: data.data.suggested,
                    progress: 0,
                    message: '',
                });
            } catch (error) {
                setState({
                    step: 'error',
                    selectedRepos: new Set(),
                    progress: 0,
                    message: '',
                    error: error instanceof Error ? error.message : 'Failed to load repositories',
                });
            }
        };

        fetchRepos();
    }, [username]);

    const toggleRepo = (name: string) => {
        setState(prev => {
            const newSelected = new Set(prev.selectedRepos);
            if (newSelected.has(name)) {
                newSelected.delete(name);
            } else {
                newSelected.add(name);
            }
            return { ...prev, selectedRepos: newSelected };
        });
    };

    const selectAll = () => {
        setState(prev => ({
            ...prev,
            selectedRepos: new Set(prev.repos?.filter(r => !r.isFork && !r.isArchived).map(r => r.name) || []),
        }));
    };

    const selectNone = () => {
        setState(prev => ({ ...prev, selectedRepos: new Set() }));
    };

    const selectSuggested = () => {
        setState(prev => ({ ...prev, selectedRepos: new Set(prev.suggestedRepos || []) }));
    };

    const runAnalysis = useCallback(async () => {
        if (!username || state.selectedRepos.size === 0) return;

        setState(prev => ({
            ...prev,
            step: 'analyzing',
            progress: 5,
            message: 'Starting analysis...',
        }));

        try {
            // Progress simulation
            const progressInterval = setInterval(() => {
                setState(prev => {
                    if (prev.step !== 'analyzing') return prev;
                    const newProgress = Math.min(prev.progress + Math.random() * 5, 90);
                    const messages = [
                        'Fetching repository contents...',
                        'Analyzing code structure...',
                        'Reading documentation...',
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
                body: JSON.stringify({
                    username,
                    selectedRepos: Array.from(state.selectedRepos),
                }),
            });

            clearInterval(progressInterval);

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Analysis failed');
            }

            setState(prev => ({
                ...prev,
                step: 'completed',
                progress: 100,
                message: 'Resume generated successfully!',
                resume: data.data.resume,
                stats: {
                    repositoriesAnalyzed: data.data.repositoriesAnalyzed,
                    tokenUsage: data.data.tokenUsage,
                    timing: data.data.timing,
                },
            }));
        } catch (error) {
            setState(prev => ({
                ...prev,
                step: 'error',
                progress: 0,
                message: 'Analysis failed',
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            }));
        }
    }, [username, state.selectedRepos]);

    // No username
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
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-4">
                        {state.user?.avatarUrl && (
                            <img
                                src={state.user.avatarUrl}
                                alt={state.user.username}
                                className="w-12 h-12 rounded-full"
                            />
                        )}
                        <div>
                            <h1 className="text-2xl font-bold">
                                {state.user?.name || username}
                            </h1>
                            <p className="text-[hsl(var(--muted-foreground))]">
                                <Github className="h-4 w-4 inline mr-1" />
                                {username} • {state.repos?.length || 0} repositories
                            </p>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {state.step === 'loading' && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-center gap-4 py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
                                <span className="text-lg">Loading repositories...</span>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Repo Selection Step */}
                {state.step === 'select' && state.repos && (
                    <>
                        <Card className="mb-6">
                            <CardHeader>
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div>
                                        <CardTitle>Select Repositories</CardTitle>
                                        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                                            Choose which repos to include in your resume. We've pre-selected the best ones.
                                        </p>
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        <Button variant="outline" size="sm" onClick={selectSuggested}>
                                            Suggested ({state.suggestedRepos?.length})
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={selectAll}>
                                            Select All
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={selectNone}>
                                            Clear
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-3 max-h-[500px] overflow-y-auto pr-2">
                                    {state.repos.map(repo => (
                                        <div
                                            key={repo.id}
                                            onClick={() => toggleRepo(repo.name)}
                                            className={`
                                                p-4 rounded-lg border cursor-pointer transition-all
                                                ${state.selectedRepos.has(repo.name)
                                                    ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5'
                                                    : 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/50'
                                                }
                                                ${repo.isFork || repo.isArchived ? 'opacity-60' : ''}
                                            `}
                                        >
                                            <div className="flex items-start gap-4">
                                                {/* Checkbox */}
                                                <div className={`
                                                    w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 flex-shrink-0
                                                    ${state.selectedRepos.has(repo.name)
                                                        ? 'bg-[hsl(var(--primary))] border-[hsl(var(--primary))]'
                                                        : 'border-[hsl(var(--muted-foreground))]'
                                                    }
                                                `}>
                                                    {state.selectedRepos.has(repo.name) && (
                                                        <Check className="h-3 w-3 text-white" />
                                                    )}
                                                </div>

                                                {/* Repo Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-semibold">{repo.name}</h3>
                                                        {repo.isFork && (
                                                            <Badge variant="secondary" className="text-xs">Fork</Badge>
                                                        )}
                                                        {repo.isArchived && (
                                                            <Badge variant="secondary" className="text-xs">Archived</Badge>
                                                        )}
                                                        {repo.language && (
                                                            <Badge variant="outline" className="text-xs">{repo.language}</Badge>
                                                        )}
                                                    </div>
                                                    {repo.description && (
                                                        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1 line-clamp-2">
                                                            {repo.description}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-4 mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                                                        <span className="flex items-center gap-1">
                                                            <Star className="h-3 w-3" /> {repo.stars}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <GitFork className="h-3 w-3" /> {repo.forks}
                                                        </span>
                                                        {repo.pushedAt && (
                                                            <span>
                                                                Updated {new Date(repo.pushedAt).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Action Bar */}
                        <div className="sticky bottom-4 p-4 bg-[hsl(var(--background))]/80 backdrop-blur-sm rounded-lg border shadow-lg">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    {state.selectedRepos.size === 0 ? (
                                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                                    ) : (
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                    )}
                                    <span className="font-medium">
                                        {state.selectedRepos.size} repositories selected
                                    </span>
                                </div>
                                <Button
                                    variant="gradient"
                                    size="lg"
                                    onClick={runAnalysis}
                                    disabled={state.selectedRepos.size === 0}
                                >
                                    <Sparkles className="h-4 w-4" />
                                    Analyze & Generate Resume
                                </Button>
                            </div>
                        </div>
                    </>
                )}

                {/* Analyzing State */}
                {state.step === 'analyzing' && (
                    <Card className="mb-8">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center animate-pulse">
                                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold">{state.message}</h3>
                                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                                        Analyzing {state.selectedRepos.size} repositories...
                                    </p>
                                </div>
                            </div>
                            <Progress value={state.progress} showLabel />
                        </CardContent>
                    </Card>
                )}

                {/* Error State */}
                {state.step === 'error' && (
                    <Card className="mb-8 border-[hsl(var(--destructive))]">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <XCircle className="h-12 w-12 text-[hsl(var(--destructive))]" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-[hsl(var(--destructive))]">
                                        {state.error?.includes('rate limit') ? 'Rate Limit Exceeded' : 'Analysis Failed'}
                                    </h3>
                                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                                        {state.error}
                                    </p>
                                </div>
                                <Button onClick={() => {
                                    setState(prev => ({ ...prev, step: 'loading', error: undefined }));
                                    window.location.reload();
                                }}>
                                    Try Again
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Completed State */}
                {state.step === 'completed' && state.resume && (
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
