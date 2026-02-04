/**
 * Section Manager Component
 * 
 * Allows users to add, remove, reorder, and toggle visibility of all resume sections
 * Both default and custom sections can be shown/hidden
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Plus,
    GripVertical,
    Eye,
    EyeOff,
    Trash2,
    ChevronUp,
    ChevronDown,
    Layers,
} from 'lucide-react';
import type { Resume, CustomSection } from '@/types';
import { CUSTOM_SECTION_TEMPLATES, DEFAULT_SECTION_ORDER, DEFAULT_SECTION_VISIBILITY } from '@/types/resume';

interface SectionManagerProps {
    resume: Resume;
    onUpdate: (path: string, value: unknown) => void;
    onAddSection: (section: CustomSection) => void;
    onRemoveSection: (sectionId: string) => void;
    onReorderSection: (sectionId: string, direction: 'up' | 'down') => void;
}

// Built-in sections
const BUILT_IN_SECTIONS = [
    { id: 'header', title: 'Header', icon: '👤', canHide: false },
    { id: 'summary', title: 'Professional Summary', icon: '📝', canHide: true },
    { id: 'skills', title: 'Technical Skills', icon: '🛠️', canHide: true },
    { id: 'experience', title: 'Work Experience', icon: '💼', canHide: true },
    { id: 'projects', title: 'Projects', icon: '🚀', canHide: true },
    { id: 'education', title: 'Education', icon: '🎓', canHide: true },
    { id: 'certifications', title: 'Certifications', icon: '📜', canHide: true },
];

export function SectionManager({
    resume,
    onUpdate,
    onAddSection,
    onRemoveSection,
    onReorderSection,
}: SectionManagerProps) {
    const [showAddMenu, setShowAddMenu] = useState(false);

    // Get current section order or default
    const sectionOrder = resume.sectionOrder || DEFAULT_SECTION_ORDER;
    const sectionVisibility = resume.sectionVisibility || DEFAULT_SECTION_VISIBILITY;
    const customSections = resume.customSections || [];

    // Toggle visibility for a section
    const toggleSectionVisibility = (sectionId: string) => {
        const newVisibility = {
            ...sectionVisibility,
            [sectionId]: !sectionVisibility[sectionId],
        };
        onUpdate('sectionVisibility', newVisibility);
    };

    // Get all sections (built-in + custom)
    const allSections = [
        ...BUILT_IN_SECTIONS.map(s => ({
            ...s,
            isBuiltIn: true,
            visible: sectionVisibility[s.id] !== false, // Default to visible
        })),
        ...customSections.map(s => ({
            id: s.id,
            title: s.title,
            icon: s.icon || '📝',
            isBuiltIn: false,
            canHide: true,
            visible: s.visible,
        })),
    ];

    // Sort by section order
    const sortedSections = [...allSections].sort((a, b) => {
        const aIndex = sectionOrder.indexOf(a.id);
        const bIndex = sectionOrder.indexOf(b.id);
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
    });

    const handleAddSection = (templateId: string) => {
        const template = CUSTOM_SECTION_TEMPLATES.find(t => t.id === templateId);
        if (!template) return;

        const newSection: CustomSection = {
            id: `${template.id}-${Date.now()}`,
            title: template.title,
            icon: template.icon,
            type: template.type,
            content: template.type === 'list' ? [] : template.type === 'items' ? [] : '',
            visible: true,
        };

        onAddSection(newSection);
        setShowAddMenu(false);
    };

    // Get available templates (exclude already added ones)
    const availableTemplates = CUSTOM_SECTION_TEMPLATES.filter(
        t => !customSections.some(s => s.id.startsWith(t.id))
    );

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Layers className="h-5 w-5 text-[hsl(var(--primary))]" />
                    Sections
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {/* Section List */}
                <div className="space-y-1">
                    {sortedSections.map((section, index) => (
                        <div
                            key={section.id}
                            className={`flex items-center gap-2 p-2 rounded-lg border ${section.visible
                                ? 'bg-[hsl(var(--background))] border-[hsl(var(--border))]'
                                : 'bg-[hsl(var(--muted))] border-transparent opacity-50'
                                }`}
                        >
                            <GripVertical className="h-4 w-4 text-[hsl(var(--muted-foreground))] cursor-grab" />
                            <span className="text-lg">{section.icon}</span>
                            <span className="flex-1 text-sm font-medium truncate">
                                {section.title}
                            </span>

                            {/* Reorder buttons */}
                            <div className="flex gap-0.5">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => onReorderSection(section.id, 'up')}
                                    disabled={index === 0}
                                >
                                    <ChevronUp className="h-3 w-3" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => onReorderSection(section.id, 'down')}
                                    disabled={index === sortedSections.length - 1}
                                >
                                    <ChevronDown className="h-3 w-3" />
                                </Button>
                            </div>

                            {/* Toggle visibility - for all sections that can hide */}
                            {section.canHide && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => {
                                        if (section.isBuiltIn) {
                                            toggleSectionVisibility(section.id);
                                        } else {
                                            // Custom section - update customSections
                                            const updatedSections = customSections.map(s =>
                                                s.id === section.id ? { ...s, visible: !s.visible } : s
                                            );
                                            onUpdate('customSections', updatedSections);
                                        }
                                    }}
                                    title={section.visible ? 'Hide section' : 'Show section'}
                                >
                                    {section.visible ? (
                                        <Eye className="h-3 w-3" />
                                    ) : (
                                        <EyeOff className="h-3 w-3" />
                                    )}
                                </Button>
                            )}

                            {/* Delete button - only for custom sections */}
                            {!section.isBuiltIn && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                                    onClick={() => onRemoveSection(section.id)}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}

                            {/* Badge for non-hideable sections */}
                            {section.isBuiltIn && !section.canHide && (
                                <Badge variant="secondary" className="text-xs">
                                    Required
                                </Badge>
                            )}
                        </div>
                    ))}
                </div>

                {/* Add Section Button */}
                <div className="relative pt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setShowAddMenu(!showAddMenu)}
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Section
                    </Button>

                    {/* Add Section Menu */}
                    {showAddMenu && (
                        <div className="absolute bottom-full left-0 right-0 mb-1 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg shadow-lg p-2 z-10 max-h-64 overflow-y-auto">
                            {availableTemplates.length === 0 ? (
                                <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-2">
                                    All section types added
                                </p>
                            ) : (
                                availableTemplates.map(template => (
                                    <button
                                        key={template.id}
                                        className="w-full flex items-center gap-2 p-2 rounded hover:bg-[hsl(var(--muted))] text-left"
                                        onClick={() => handleAddSection(template.id)}
                                    >
                                        <span className="text-lg">{template.icon}</span>
                                        <span className="text-sm">{template.title}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>

                <p className="text-xs text-[hsl(var(--muted-foreground))] pt-1">
                    👁️ Toggle visibility • ↕️ Reorder • ➕ Add custom
                </p>
            </CardContent>
        </Card>
    );
}

export default SectionManager;
