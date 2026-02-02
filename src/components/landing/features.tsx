/**
 * Features Section
 */

import {
    Zap,
    Shield,
    Palette,
    FileText,
    Sparkles,
    Globe,
    Code2,
    Brain
} from 'lucide-react';

const features = [
    {
        icon: Brain,
        title: 'Smart Analysis',
        description: 'AI understands your code, not just file names. It extracts real skills from your implementations.',
    },
    {
        icon: Zap,
        title: 'Lightning Fast',
        description: 'Generate a complete resume in under 2 minutes, even with 20+ repositories.',
    },
    {
        icon: Shield,
        title: 'Privacy First',
        description: 'We only read public repositories. Your data is never stored permanently.',
    },
    {
        icon: Palette,
        title: 'Multiple Templates',
        description: 'Choose from Modern, Classic, Minimal, or Creative templates. All ATS-friendly.',
    },
    {
        icon: FileText,
        title: 'Export Options',
        description: 'Download as PDF for online applications or DOCX for further editing.',
    },
    {
        icon: Sparkles,
        title: 'AI Enhancement',
        description: 'Let AI improve your bullet points to be more impactful and professional.',
    },
    {
        icon: Code2,
        title: 'Tech Detection',
        description: 'Automatically detects frameworks, libraries, and tools from your package files.',
    },
    {
        icon: Globe,
        title: '100% Free',
        description: 'Completely free to use. No account required, no hidden limits.',
    },
];

export function Features() {
    return (
        <section className="py-24 px-4 bg-[hsl(var(--muted))] bg-opacity-50">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                        Powerful Features
                    </h2>
                    <p className="text-lg text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
                        Everything you need to create a professional developer resume
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="group p-6 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] transition-all hover:shadow-lg hover:border-[hsl(var(--primary))]"
                        >
                            <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mb-4 group-hover:animate-pulse">
                                <feature.icon className="h-6 w-6 text-white" />
                            </div>

                            <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                            <p className="text-sm text-[hsl(var(--muted-foreground))]">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
