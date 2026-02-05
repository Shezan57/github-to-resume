/**
 * Analysis Page v2
 * 
 * New flow:
 * 1. Fetch repos list
 * 2. Check README status for selected repos
 * 3. Show tips and README generation option
 * 4. Analyze using README-only (fast)
 * 5. Show generated resume
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
    ArrowRight,
    FileText,
    Sparkles,
    Clock,
    Coins,
    Star,
    GitFork,
    Check,
    AlertCircle,
    AlertTriangle,
    FileQuestion,
    Copy,
    ExternalLink,
    Lightbulb,
    BookOpen,
    Target,
} from 'lucide-react';
import { RoleSelector, JOB_ROLES, type JobRole } from '@/components/resume/role-selector';
import { ATSScoreModal } from '@/components/resume/ats-score-modal';
import { deepClone } from '@/lib/utils';
import type { Resume } from '@/types';
import { useUsage } from '@/contexts/usage-context';
import { PricingBanner } from '@/components/pricing/pricing-banner';

interface RepoInfo {
    id: number;
    name: string;
    fullName: string;
    description: string | null;
    url: string;
    homepage: string | null;
    language: string | null;
    stars: number;
    forks: number;
    topics: string[];
    pushedAt: string;
    isFork: boolean;
    isArchived: boolean;
    score: number;
    hasReadme?: boolean; // Checked after selection
}

interface UserInfo {
    username: string;
    name: string | null;
    avatarUrl: string;
    bio: string | null;
    publicRepos: number;
}

type PageStep = 'loading' | 'select' | 'checking' | 'review' | 'analyzing' | 'completed' | 'error';

interface PageState {
    step: PageStep;
    user?: UserInfo;
    repos?: RepoInfo[];
    selectedRepos: Set<string>;
    suggestedRepos?: string[];
    readmeStatus?: Map<string, boolean>;
    selectedRole: JobRole | null;
    customRole: string;
    showATSModal: boolean;
    progress: number;
    message: string;
    resume?: Resume;
    error?: string;
    generatingReadmeFor?: string;
    generatedReadme?: string;
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
    const { user } = useAuth(); // Get auth user for tier info

    const [state, setState] = useState<PageState>({
        step: 'loading',
        selectedRepos: new Set(),
        selectedRole: null,
        customRole: '',
        showATSModal: false,
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
                    selectedRole: null,
                    customRole: '',
                    showATSModal: false,
                    progress: 0,
                    message: '',
                });
            } catch (error) {
                setState({
                    step: 'error',
                    selectedRepos: new Set(),
                    selectedRole: null,
                    customRole: '',
                    showATSModal: false,
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

    // Check README status for selected repos
    const checkReadmeStatus = async () => {
        if (!username || state.selectedRepos.size === 0) return;

        setState(prev => ({
            ...prev,
            step: 'checking',
            message: 'Checking README status...',
        }));

        try {
            const response = await fetch('/api/check-readme', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    repos: Array.from(state.selectedRepos),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to check README status');
            }

            const readmeStatus = new Map<string, boolean>();
            data.data.results.forEach((r: { repoName: string; hasReadme: boolean }) => {
                readmeStatus.set(r.repoName, r.hasReadme);
            });

            setState(prev => ({
                ...prev,
                step: 'review',
                readmeStatus,
                message: '',
            }));
        } catch (error) {
            setState(prev => ({
                ...prev,
                step: 'error',
                error: error instanceof Error ? error.message : 'Failed to check README status',
            }));
        }
    };

    // Generate README for a repo
    const generateReadme = async (repoName: string) => {
        if (!username) return;

        const repo = state.repos?.find(r => r.name === repoName);
        if (!repo) return;

        setState(prev => ({
            ...prev,
            generatingReadmeFor: repoName,
        }));

        try {
            const response = await fetch('/api/generate-readme', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    repoName,
                    description: repo.description,
                    language: repo.language,
                    topics: repo.topics,
                    homepage: repo.homepage,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate README');
            }

            setState(prev => ({
                ...prev,
                generatingReadmeFor: undefined,
                generatedReadme: data.data.readme,
            }));
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to generate README');
            setState(prev => ({
                ...prev,
                generatingReadmeFor: undefined,
            }));
        }
    };

    const copyReadme = () => {
        if (state.generatedReadme) {
            navigator.clipboard.writeText(state.generatedReadme);
            alert('README copied to clipboard!');
        }
    };

    const closeReadmeModal = () => {
        setState(prev => ({ ...prev, generatedReadme: undefined }));
    };

    const { incrementGeneration, hasReachedGenerationLimit, setShowRegistrationWall } = useUsage();

    // Run analysis with selected repos
    const runAnalysis = useCallback(async () => {
        if (!username || state.selectedRepos.size === 0) return;

        if (hasReachedGenerationLimit) {
            setShowRegistrationWall(true);
            return;
        }

        setState(prev => ({
            ...prev,
            step: 'analyzing',
            progress: 5,
            message: 'Starting analysis...',
        }));

        try {
            const progressInterval = setInterval(() => {
                setState(prev => {
                    if (prev.step !== 'analyzing') return prev;
                    const newProgress = Math.min(prev.progress + Math.random() * 5, 90);
                    const messages = [
                        'Fetching README files...',
                        'Analyzing project content...',
                        'Extracting skills and achievements...',
                        'Generating resume content...',
                        'Finalizing your resume...',
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
                    targetRole: state.selectedRole?.id,
                    customRole: state.customRole || undefined,
                }),
            });

            clearInterval(progressInterval);

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Analysis failed');
            }

            // Increment generation count on success
            incrementGeneration();

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
    }, [username, state.selectedRepos, hasReachedGenerationLimit, incrementGeneration, setShowRegistrationWall]);

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

    const reposWithoutReadme = state.readmeStatus
        ? Array.from(state.selectedRepos).filter(name => !state.readmeStatus?.get(name))
        : [];

    // Apply AI fix
    const handleApplyFix = useCallback((location: string, value: string) => {
        setState(prev => {
            if (!prev.resume) return prev;

            const updatedResume = deepClone(prev.resume);

            // Normalize location to dot notation
            let path = location.replace(/[:]/g, '.').replace(/\[(\d+)\]/g, '.$1');

            // Fix common singular/plural mismatches from LLM
            path = path.replace(/^project\./, 'projects.');
            path = path.replace(/\.bullet\./, '.bullets.');

            // Handle "project.0.description" -> "projects.0.description"
            if (path.startsWith('project.')) path = path.replace('project.', 'projects.');

            // Update the value at the path
            const parts = path.split('.');
            let current: any = updatedResume;

            for (let i = 0; i < parts.length - 1; i++) {
                const key = parts[i];
                if (current[key] === undefined) {
                    current[key] = {}; // Should probably not happen for existing paths
                }
                current = current[key];
            }

            if (current) {
                current[parts[parts.length - 1]] = value;
            }

            return {
                ...prev,
                resume: updatedResume
            };
        });
    }, []);

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

                {/* Pricing Banner */}
                <PricingBanner />

                {/* Step Indicator */}
                {(state.step === 'select' || state.step === 'checking' || state.step === 'review') && (
                    <div className="flex items-center gap-2 mb-6 text-sm">
                        <span className={`px-3 py-1 rounded-full ${state.step === 'select' ? 'bg-[hsl(var(--primary))] text-white' : 'bg-[hsl(var(--muted))]'}`}>
                            1. Select Repos
                        </span>
                        <ArrowRight className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                        <span className={`px-3 py-1 rounded-full ${state.step === 'review' ? 'bg-[hsl(var(--primary))] text-white' : 'bg-[hsl(var(--muted))]'}`}>
                            2. Review & Generate
                        </span>
                    </div>
                )}

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
                        {/* Tips Card */}
                        <Card className="mb-6 border-amber-500/30 bg-amber-500/5">
                            <CardContent className="pt-4">
                                <div className="flex gap-3">
                                    <Lightbulb className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="font-semibold text-amber-600 dark:text-amber-400 mb-1">
                                            💡 Tips for Better Results
                                        </h3>
                                        <ul className="text-sm text-[hsl(var(--muted-foreground))] space-y-1">
                                            <li>• Select repos that best represent your skills and achievements</li>
                                            <li>• Repos with <strong>README files</strong> generate much better results</li>
                                            <li>• If a repo lacks a README, we can generate one for you</li>
                                            <li>• Quality over quantity - 5-10 well-documented repos beat 50 empty ones</li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="mb-6">
                            <CardHeader>
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div>
                                        <CardTitle>Select Repositories</CardTitle>
                                        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                                            Choose which repos to include in your resume
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
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-semibold">{repo.name}</h3>
                                                        {repo.isFork && <Badge variant="secondary" className="text-xs">Fork</Badge>}
                                                        {repo.isArchived && <Badge variant="secondary" className="text-xs">Archived</Badge>}
                                                        {repo.language && <Badge variant="outline" className="text-xs">{repo.language}</Badge>}
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
                                                            <span>Updated {new Date(repo.pushedAt).toLocaleDateString()}</span>
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
                                    onClick={checkReadmeStatus}
                                    disabled={state.selectedRepos.size === 0}
                                >
                                    <ArrowRight className="h-4 w-4" />
                                    Continue
                                </Button>
                            </div>
                        </div>
                    </>
                )}

                {/* Checking README Status */}
                {state.step === 'checking' && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-center gap-4 py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
                                <span className="text-lg">Checking README status for selected repos...</span>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Review Step - Show README Status */}
                {state.step === 'review' && state.readmeStatus && (
                    <>
                        {/* Warning for repos without README */}
                        {reposWithoutReadme.length > 0 && (
                            <Card className="mb-6 border-amber-500/30 bg-amber-500/5">
                                <CardContent className="pt-4">
                                    <div className="flex gap-3">
                                        <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h3 className="font-semibold text-amber-600 dark:text-amber-400 mb-2">
                                                {reposWithoutReadme.length} repo{reposWithoutReadme.length > 1 ? 's' : ''} missing README
                                            </h3>
                                            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3">
                                                Repos without README files may produce lower quality resume content.
                                                You can generate READMEs below or proceed anyway.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen className="h-5 w-5" />
                                    README Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {Array.from(state.selectedRepos).map(repoName => {
                                        const hasReadme = state.readmeStatus?.get(repoName);
                                        const repo = state.repos?.find(r => r.name === repoName);

                                        return (
                                            <div key={repoName} className="flex items-center justify-between p-3 rounded-lg border">
                                                <div className="flex items-center gap-3">
                                                    {hasReadme ? (
                                                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                                    ) : (
                                                        <FileQuestion className="h-5 w-5 text-amber-500" />
                                                    )}
                                                    <div>
                                                        <span className="font-medium">{repoName}</span>
                                                        <span className={`text-sm ml-2 ${hasReadme ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                            {hasReadme ? '✓ Has README' : '⚠ No README'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    {!hasReadme && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                generateReadme(repoName);
                                                            }}
                                                            disabled={state.generatingReadmeFor === repoName}
                                                        >
                                                            {state.generatingReadmeFor === repoName ? (
                                                                <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Generating...</>
                                                            ) : (
                                                                <><Sparkles className="h-3 w-3 mr-1" /> Generate README</>
                                                            )}
                                                        </Button>
                                                    )}
                                                    <a
                                                        href={repo?.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Button variant="ghost" size="sm">
                                                            <ExternalLink className="h-3 w-3" />
                                                        </Button>
                                                    </a>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Role Selector */}
                        <div className="mb-6">
                            <RoleSelector
                                selectedRole={state.selectedRole}
                                customRole={state.customRole}
                                onRoleSelect={(role) => setState(prev => ({ ...prev, selectedRole: role }))}
                                onCustomRoleChange={(role) => setState(prev => ({ ...prev, customRole: role }))}
                            />
                        </div>

                        {/* Action Bar */}
                        <div className="sticky bottom-4 p-4 bg-[hsl(var(--background))]/80 backdrop-blur-sm rounded-lg border shadow-lg">
                            <div className="flex items-center justify-between gap-4">
                                <Button variant="outline" onClick={() => setState(prev => ({ ...prev, step: 'select', readmeStatus: undefined }))}>
                                    <ArrowLeft className="h-4 w-4 mr-1" />
                                    Back to Selection
                                </Button>
                                <div className="flex items-center gap-3">
                                    {(state.selectedRole || state.customRole) && (
                                        <span className="text-sm text-[hsl(var(--muted-foreground))]">
                                            🎯 Targeting: <strong>{state.customRole || state.selectedRole?.title}</strong>
                                        </span>
                                    )}
                                    <Button variant="gradient" size="lg" onClick={runAnalysis}>
                                        <Sparkles className="h-4 w-4" />
                                        Analyze & Generate Resume
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Generated README Modal */}
                {state.generatedReadme && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="max-w-3xl w-full max-h-[80vh] overflow-hidden">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Generated README.md
                                    </CardTitle>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={copyReadme}>
                                            <Copy className="h-4 w-4 mr-1" /> Copy
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={closeReadmeModal}>
                                            <XCircle className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                                    Copy this content and add it to your GitHub repository as README.md
                                </p>
                            </CardHeader>
                            <CardContent className="overflow-y-auto max-h-[60vh]">
                                <pre className="whitespace-pre-wrap text-sm bg-[hsl(var(--muted))] p-4 rounded-lg overflow-x-auto">
                                    {state.generatedReadme}
                                </pre>
                            </CardContent>
                        </Card>
                    </div>
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
                                        {state.error?.includes('rate limit') ? 'Rate Limit Exceeded' : 'Error'}
                                    </h3>
                                    <p className="text-sm text-[hsl(var(--muted-foreground))]">{state.error}</p>
                                </div>
                                <Button onClick={() => window.location.reload()}>Try Again</Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Completed State */}
                {state.step === 'completed' && state.resume && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
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
                                            <p className="text-sm text-[hsl(var(--muted-foreground))]">Generation Time</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                                        Resume Generated!
                                    </CardTitle>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => setState(prev => ({ ...prev, showATSModal: true }))}
                                        >
                                            <Target className="h-4 w-4" />
                                            Check ATS Score
                                        </Button>
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
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-3xl font-bold">{state.resume.header.name}</h2>
                                        <p className="text-lg text-[hsl(var(--primary))]">{state.resume.header.title}</p>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-2">Summary</h3>
                                        <p className="text-[hsl(var(--muted-foreground))]">{state.resume.summary}</p>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-2">Skills</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {(state.resume.skills.categories || [])
                                                .flatMap(cat => cat.items)
                                                .slice(0, 15).map((skill, i) => (
                                                    <Badge key={i} variant="secondary">{skill}</Badge>
                                                ))}
                                        </div>
                                    </div>
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

            {/* ATS Score Modal */}
            {state.showATSModal && state.resume && (
                <ATSScoreModal
                    resume={state.resume}
                    targetRole={state.customRole || state.selectedRole?.id}
                    onClose={() => setState(prev => ({ ...prev, showATSModal: false }))}
                    onApplyFix={handleApplyFix}
                    tier={user?.tier === 'premium' ? 'openai' : 'groq'}
                />
            )}
        </div>
    );
}

import { useAuth } from '@/contexts/auth-context';

export default function AnalyzePage() {
    const { user } = useAuth();

    // Inject user tier into state if possible, or just pass it down. 
    // Actually AnalyzeContent is internal. Let's just wrap it or let it use the hook directly?
    // AnalyzeContent is defined inside the same file but as a component.
    // Ideally AnalyzeContent should use useAuth hook to get the tier.

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
