/**
 * Resume Editor Page
 * 
 * Full-featured resume editor with live preview, inline editing, 
 * ATS scoring, keyword suggestions, and custom sections
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ResumeTemplate } from '@/components/resume/resume-template';
import { SectionManager } from '@/components/resume/section-manager';
import { KeywordSuggestions } from '@/components/resume/keyword-suggestions';
import { ATSScoreModal } from '@/components/resume/ats-score-modal';
import {
    ArrowLeft,
    Download,
    FileText,
    Sparkles,
    Loader2,
    Check,
    Palette,
    Target,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import type { Resume, ResumeTemplate as ResumeTemplateType, CustomSection } from '@/types';
import { DEFAULT_SECTION_ORDER } from '@/types/resume';
import { getResume, saveResume } from '@/lib/storage';
import { deepClone } from '@/lib/utils';

type ViewMode = 'edit' | 'preview';

export default function ResumeEditorPage() {
    const params = useParams();
    const router = useRouter();
    const resumeId = params.id as string;

    const [resume, setResume] = useState<Resume | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('edit');
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [showATSModal, setShowATSModal] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Load resume from localStorage
    useEffect(() => {
        // First try to get from generated_resume (just created)
        const generatedResume = localStorage.getItem('generated_resume');
        if (generatedResume) {
            const parsed = JSON.parse(generatedResume) as Resume;
            if (parsed.id === resumeId) {
                // Ensure new fields exist
                const resumeWithDefaults = {
                    ...parsed,
                    customSections: parsed.customSections || [],
                    sectionOrder: parsed.sectionOrder || DEFAULT_SECTION_ORDER,
                    sectionVisibility: parsed.sectionVisibility || { header: true, summary: true, skills: true, experience: true, projects: true, education: true, certifications: true },
                };
                setResume(resumeWithDefaults);
                // Save to permanent storage
                saveResume(resumeWithDefaults);
                // Clear the temporary storage
                localStorage.removeItem('generated_resume');
                return;
            }
        }

        // Otherwise load from permanent storage
        const saved = getResume(resumeId);
        if (saved) {
            // Ensure new fields exist
            const resumeWithDefaults = {
                ...saved,
                customSections: saved.customSections || [],
                sectionOrder: saved.sectionOrder || DEFAULT_SECTION_ORDER,
                sectionVisibility: saved.sectionVisibility || { header: true, summary: true, skills: true, experience: true, projects: true, education: true, certifications: true },
            };
            setResume(resumeWithDefaults);
        }
    }, [resumeId]);

    // Handle updates to resume fields
    const handleUpdate = useCallback((path: string, value: unknown) => {
        setResume(prev => {
            if (!prev) return prev;

            const updated = deepClone(prev);
            const parts = path.split('.');
            let current: Record<string, unknown> = updated as unknown as Record<string, unknown>;

            for (let i = 0; i < parts.length - 1; i++) {
                const key = parts[i];
                if (current[key] === undefined) {
                    current[key] = {};
                }
                current = current[key] as Record<string, unknown>;
            }

            current[parts[parts.length - 1]] = value;
            return updated;
        });
    }, []);

    // Add custom section
    const handleAddSection = useCallback((section: CustomSection) => {
        setResume(prev => {
            if (!prev) return prev;
            const updated = deepClone(prev);
            updated.customSections = [...(updated.customSections || []), section];
            updated.sectionOrder = [...(updated.sectionOrder || DEFAULT_SECTION_ORDER), section.id];
            return updated;
        });
    }, []);

    // Remove custom section
    const handleRemoveSection = useCallback((sectionId: string) => {
        setResume(prev => {
            if (!prev) return prev;
            const updated = deepClone(prev);
            updated.customSections = (updated.customSections || []).filter(s => s.id !== sectionId);
            updated.sectionOrder = (updated.sectionOrder || []).filter(id => id !== sectionId);
            return updated;
        });
    }, []);

    // Reorder section
    const handleReorderSection = useCallback((sectionId: string, direction: 'up' | 'down') => {
        setResume(prev => {
            if (!prev) return prev;
            const updated = deepClone(prev);
            const order = [...(updated.sectionOrder || DEFAULT_SECTION_ORDER)];
            const currentIndex = order.indexOf(sectionId);

            if (currentIndex === -1) return prev;

            const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
            if (newIndex < 0 || newIndex >= order.length) return prev;

            // Swap
            [order[currentIndex], order[newIndex]] = [order[newIndex], order[currentIndex]];
            updated.sectionOrder = order;
            return updated;
        });
    }, []);

    // Auto-save
    useEffect(() => {
        if (!resume) return;

        const timeout = setTimeout(() => {
            setIsSaving(true);
            saveResume(resume);
            setLastSaved(new Date());
            setTimeout(() => setIsSaving(false), 500);
        }, 1000);

        return () => clearTimeout(timeout);
    }, [resume]);

    // Export to PDF (using browser print)
    const exportToPDF = useCallback(() => {
        setIsExporting(true);
        setTimeout(() => {
            window.print();
            setIsExporting(false);
        }, 100);
    }, []);

    if (!resume) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[hsl(var(--muted))]">
            {/* Toolbar - hidden when printing */}
            <div className="no-print sticky top-0 z-50 bg-[hsl(var(--background))] border-b border-[hsl(var(--border))] shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="font-semibold">Resume Editor</h1>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                {isSaving ? (
                                    <span className="flex items-center gap-1">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Saving...
                                    </span>
                                ) : lastSaved ? (
                                    <span className="flex items-center gap-1">
                                        <Check className="h-3 w-3 text-emerald-500" />
                                        Saved {lastSaved.toLocaleTimeString()}
                                    </span>
                                ) : (
                                    'Changes auto-saved'
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* ATS Check Button */}
                        <Button
                            variant="outline"
                            onClick={() => setShowATSModal(true)}
                        >
                            <Target className="h-4 w-4" />
                            <span className="hidden sm:inline ml-1">ATS Score</span>
                        </Button>

                        {/* View Mode Toggle */}
                        <div className="flex rounded-lg overflow-hidden border border-[hsl(var(--border))]">
                            <Button
                                variant={viewMode === 'edit' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('edit')}
                                className="rounded-none"
                            >
                                Edit
                            </Button>
                            <Button
                                variant={viewMode === 'preview' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('preview')}
                                className="rounded-none"
                            >
                                Preview
                            </Button>
                        </div>

                        {/* Export Button */}
                        <Button
                            variant="gradient"
                            onClick={exportToPDF}
                            isLoading={isExporting}
                        >
                            <Download className="h-4 w-4" />
                            <span className="hidden sm:inline ml-1">Export PDF</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Editor Panel - hidden in preview mode */}
                    {viewMode === 'edit' && (
                        <div className={`no-print transition-all duration-300 ${sidebarCollapsed ? 'lg:w-12' : 'lg:w-96'}`}>
                            {/* Collapse Toggle */}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="hidden lg:flex mb-2 w-full justify-center"
                                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            >
                                {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                                {!sidebarCollapsed && <span className="ml-1">Collapse</span>}
                            </Button>

                            {!sidebarCollapsed && (
                                <div className="space-y-4">
                                    {/* Quick Stats */}
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <FileText className="h-5 w-5 text-[hsl(var(--primary))]" />
                                                Resume Stats
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-[hsl(var(--muted-foreground))]">Projects</span>
                                                <Badge variant="secondary">{resume.projects.length}</Badge>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[hsl(var(--muted-foreground))]">Experience</span>
                                                <Badge variant="secondary">{resume.experience.length}</Badge>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[hsl(var(--muted-foreground))]">Skills</span>
                                                <Badge variant="secondary">
                                                    {resume.skills.languages.length +
                                                        resume.skills.frameworks.length +
                                                        resume.skills.tools.length}
                                                </Badge>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[hsl(var(--muted-foreground))]">Custom Sections</span>
                                                <Badge variant="secondary">{resume.customSections?.length || 0}</Badge>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Keyword Suggestions */}
                                    <KeywordSuggestions resume={resume} />

                                    {/* Section Manager */}
                                    <SectionManager
                                        resume={resume}
                                        onUpdate={handleUpdate}
                                        onAddSection={handleAddSection}
                                        onRemoveSection={handleRemoveSection}
                                        onReorderSection={handleReorderSection}
                                    />

                                    {/* Template Selection */}
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Palette className="h-5 w-5 text-[hsl(var(--primary))]" />
                                                Template
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 gap-2">
                                                {(['modern', 'classic', 'minimal', 'creative'] as ResumeTemplateType[]).map((template) => (
                                                    <Button
                                                        key={template}
                                                        variant={resume.template === template ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => handleUpdate('template', template)}
                                                        className="capitalize"
                                                    >
                                                        {template}
                                                    </Button>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Pro Tips */}
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Sparkles className="h-5 w-5 text-[hsl(var(--primary))]" />
                                                Tips
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="text-sm text-[hsl(var(--muted-foreground))] space-y-2">
                                            <p>• Click any text in the resume to edit</p>
                                            <p>• Use action verbs and quantify results</p>
                                            <p>• Check ATS Score before applying</p>
                                            <p>• Add custom sections for unique content</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Resume Preview */}
                    <div className="flex-1 flex justify-center">
                        <div className="transform-gpu origin-top" style={{ transform: 'scale(0.9)' }}>
                            <ResumeTemplate
                                resume={resume}
                                isEditing={viewMode === 'edit'}
                                onUpdate={handleUpdate}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ATS Score Modal */}
            {showATSModal && (
                <ATSScoreModal
                    resume={resume}
                    onClose={() => setShowATSModal(false)}
                />
            )}

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body {
                        background: white !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .resume-page {
                        margin: 0 !important;
                        padding: 15mm !important;
                        box-shadow: none !important;
                        transform: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
