/**
 * Resume Template Wrapper
 * 
 * Renders the appropriate template based on resume.template property
 */

'use client';

import { Resume } from '@/types';
import { ModernTemplate } from './modern-template';
import { ClassicTemplate } from './classic-template';
import { MinimalTemplate } from './minimal-template';
import { CreativeTemplate } from './creative-template';

interface ResumeTemplateProps {
    resume: Resume;
    isEditing?: boolean;
    onUpdate?: (path: string, value: unknown) => void;
}

export function ResumeTemplate({ resume, isEditing = false, onUpdate }: ResumeTemplateProps) {
    switch (resume.template) {
        case 'classic':
            return <ClassicTemplate resume={resume} isEditing={isEditing} onUpdate={onUpdate} />;
        case 'minimal':
            return <MinimalTemplate resume={resume} isEditing={isEditing} onUpdate={onUpdate} />;
        case 'creative':
            return <CreativeTemplate resume={resume} isEditing={isEditing} onUpdate={onUpdate} />;
        case 'modern':
        default:
            return <ModernTemplate resume={resume} isEditing={isEditing} onUpdate={onUpdate} />;
    }
}
