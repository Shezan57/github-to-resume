/**
 * Hero Section Component
 */

import { GitHubInput } from './github-input';
import { Sparkles, Github, FileText, Download } from 'lucide-react';

export function Hero() {
    return (
        <section className="relative min-h-[90vh] flex items-center justify-center px-4 py-20 overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0 -z-10">
                {/* Gradient orbs */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full gradient-bg opacity-20 blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-blue-500 opacity-20 blur-3xl" />

                {/* Grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.02]"
                    style={{
                        backgroundImage: `
              linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)
            `,
                        backgroundSize: '60px 60px',
                    }}
                />
            </div>

            <div className="max-w-4xl mx-auto text-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
                    <Sparkles className="h-4 w-4 text-[hsl(var(--primary))]" />
                    <span className="text-sm font-medium">AI-Powered Resume Generator</span>
                </div>

                {/* Headline */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                    Transform Your
                    <br />
                    <span className="gradient-text">GitHub Profile</span>
                    <br />
                    Into a Resume
                </h1>

                {/* Subheadline */}
                <p className="text-lg sm:text-xl text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto mb-10">
                    Our AI analyzes your repositories, extracts your skills and achievements,
                    and generates a professional resume in seconds. Free and open source.
                </p>

                {/* Input Form */}
                <GitHubInput />

                {/* Stats */}
                <div className="flex flex-wrap justify-center gap-8 sm:gap-16 mt-16">
                    <Stat icon={Github} value="20+" label="Repos Analyzed" />
                    <Stat icon={FileText} value="4" label="Templates" />
                    <Stat icon={Download} value="PDF & DOCX" label="Export Formats" />
                </div>
            </div>
        </section>
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
