/**
 * Hero Section Component
 */

import { Github, Sparkles, FileText, Download, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { GitHubInput } from './github-input';
import { UserNav } from "@/components/ui/user-nav";

import { UploadResume } from "@/components/upload/upload-resume";

export function Hero() {
    return (
        <div className="relative overflow-hidden bg-background pt-[6.5rem]">
            <div className="absolute top-4 right-4 z-50">
                <UserNav />
            </div>
            {/* Background decorations */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            <div className="absolute inset-0 -z-10">
                {/* Gradient orbs */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full gradient-bg opacity-20 blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-blue-500 opacity-20 blur-3xl" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center relative z-10">
                <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm leading-6 text-[hsl(var(--muted-foreground))] mb-8 bg-[hsl(var(--background))]/50 backdrop-blur-sm">
                    <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
                    <span>New: AI-Powered Resume Scoring</span>
                </div>

                <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[hsl(var(--foreground))] to-[hsl(var(--muted-foreground))]">
                    Turn your GitHub Profile into a <br className="hidden sm:block" />
                    <span className="gradient-text">Pro Resume</span> in Seconds
                </h1>

                <p className="text-lg sm:text-xl text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto mb-10">
                    Stop writing resumes from scratch. Our AI analyzes your repositories,
                    pull requests, and contributions to generate a data-driven resume that highlights your real skills.
                </p>

                <div className="max-w-md mx-auto mb-12">
                    <div className="flex flex-col gap-6 w-full max-w-xl mx-auto">
                        <GitHubInput />

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-[hsl(var(--border))]" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-[hsl(var(--background))] px-2 text-[hsl(var(--muted-foreground))]">
                                    Or upload existing
                                </span>
                            </div>
                        </div>

                        <UploadResume />
                    </div>
                </div>

                <div className="flex flex-wrap justify-center gap-8 text-sm text-[hsl(var(--muted-foreground))]">
                    <div className="flex items-center gap-2">
                        <Github className="h-5 w-5" />
                        <span>GitHub Integration</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        <span>ATS-Friendly PDF</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        <span>Instant Export</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Stat({
    icon: Icon,
    value,
    label
}: {
    icon: React.ComponentType<{ className?: string }>;
    value: string;
    label: string;
}) {
    return (
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[hsl(var(--primary))] bg-opacity-10">
                <Icon className="h-5 w-5 text-[hsl(var(--primary))]" />
            </div>
            <div className="text-left">
                <p className="text-xl font-bold">{value}</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{label}</p>
            </div>
        </div>
    );
}
