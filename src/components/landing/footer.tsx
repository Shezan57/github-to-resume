/**
 * Footer Component
 */

import { Github, Heart } from 'lucide-react';

export function Footer() {
    return (
        <footer className="py-12 px-4 border-t border-[hsl(var(--border))]">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
                            <Github className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-bold text-lg">GitHub Resume</span>
                    </div>

                    {/* Made with love */}
                    <p className="flex items-center gap-1 text-sm text-[hsl(var(--muted-foreground))]">
                        Made with <Heart className="h-4 w-4 text-red-500 fill-red-500" /> • Free & Open Source
                    </p>

                    {/* Links */}
                    <div className="flex items-center gap-6">
                        <a
                            href="https://github.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                        >
                            <Github className="h-5 w-5" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
