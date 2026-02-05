/**
 * GitHub Input Form Component
 * 
 * Main input form for entering GitHub username/URL and triggering analysis
 */

'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Github, Sparkles, ArrowRight } from 'lucide-react';
import { parseGitHubUrl, isValidGitHubUsername } from '@/lib/utils';
import { useUsage } from '@/contexts/usage-context';

interface GitHubInputProps {
    onAnalyze?: (username: string) => void;
}

export function GitHubInput({ onAnalyze }: GitHubInputProps) {
    const [input, setInput] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { hasReachedGenerationLimit, setShowRegistrationWall } = useUsage();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!input.trim()) {
            setError('Please enter a GitHub username or profile URL');
            return;
        }

        // Parse the input
        const parsed = parseGitHubUrl(input.trim());
        const username = parsed?.username || input.trim();

        // Validate
        if (!isValidGitHubUsername(username)) {
            setError('Invalid GitHub username format');
            return;
        }

        if (onAnalyze) {
            onAnalyze(username);
        } else {
            // Check limits before navigating
            if (hasReachedGenerationLimit) {
                setShowRegistrationWall(true);
                return;
            }
            // Navigate to analyze page
            router.push(`/analyze?username=${encodeURIComponent(username)}`);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto">
            <div className="relative">
                {/* Glow effect behind input */}
                <div className="absolute -inset-1 rounded-2xl gradient-bg opacity-30 blur-xl" />

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Enter GitHub username or profile URL"
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                setError('');
                            }}
                            className="pl-10 h-12 text-base bg-background shadow-sm"
                            aria-label="GitHub username or URL"
                        />
                    </div>

                    <Button
                        type="submit"
                        variant="gradient"
                        size="lg"
                        isLoading={isLoading}
                        className="h-12 px-8 text-base font-semibold shadow-sm sm:w-auto w-full"
                    >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Resume
                    </Button>
                </div>
            </div>

            {error && (
                <p className="mt-3 text-center text-sm text-[hsl(var(--destructive))]">
                    {error}
                </p>
            )}

            <p className="mt-4 text-center text-sm text-[hsl(var(--muted-foreground))]">
                Works with any public GitHub profile. No login required.
            </p>
        </form>
    );
}
