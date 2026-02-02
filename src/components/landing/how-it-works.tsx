/**
 * How It Works Section
 */

import { Search, Cpu, FileEdit, Download } from 'lucide-react';

const steps = [
    {
        icon: Search,
        title: 'Enter Your GitHub',
        description: 'Paste your GitHub profile URL or username. We\'ll fetch your public repositories automatically.',
    },
    {
        icon: Cpu,
        title: 'AI Analysis',
        description: 'Our AI reads your code, READMEs, and project configs to understand your skills and achievements.',
    },
    {
        icon: FileEdit,
        title: 'Edit & Customize',
        description: 'Review the generated resume, edit any section, and choose from multiple professional templates.',
    },
    {
        icon: Download,
        title: 'Export & Apply',
        description: 'Download your resume in PDF or DOCX format, ready to send to recruiters.',
    },
];

export function HowItWorks() {
    return (
        <section className="py-24 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                        How It Works
                    </h2>
                    <p className="text-lg text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
                        From GitHub profile to professional resume in four simple steps
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {steps.map((step, index) => (
                        <div key={index} className="relative">
                            {/* Connector line */}
                            {index < steps.length - 1 && (
                                <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-[hsl(var(--primary))] to-transparent" />
                            )}

                            <div className="relative p-6 rounded-2xl glass transition-transform hover:scale-105">
                                {/* Step number */}
                                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white text-sm font-bold">
                                    {index + 1}
                                </div>

                                {/* Icon */}
                                <div className="w-12 h-12 rounded-xl bg-[hsl(var(--primary))] bg-opacity-10 flex items-center justify-center mb-4">
                                    <step.icon className="h-6 w-6 text-[hsl(var(--primary))]" />
                                </div>

                                {/* Content */}
                                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
