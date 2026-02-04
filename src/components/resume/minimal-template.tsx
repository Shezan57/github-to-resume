/**
 * Minimal Resume Template Component
 * 
 * Clean, minimalist template with full editing support
 */

'use client';

import { Resume, CustomSection, CustomSectionItem, ExperienceItem, ProjectItem, EducationItem, CertificationItem } from '@/types';
import { Plus, Trash2, X } from 'lucide-react';

interface ResumeTemplateProps {
    resume: Resume;
    isEditing?: boolean;
    onUpdate?: (path: string, value: unknown) => void;
}

const generateId = () => `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function MinimalTemplate({ resume, isEditing = false, onUpdate }: ResumeTemplateProps) {
    const handleEdit = (path: string, value: unknown) => {
        if (isEditing && onUpdate) onUpdate(path, value);
    };

    const addExperience = () => {
        handleEdit('experience', [...resume.experience, {
            id: generateId(), company: 'Company', title: 'Title', location: '',
            startDate: 'Start', endDate: 'End', current: false, bullets: ['Responsibility']
        } as ExperienceItem]);
    };

    const addProject = () => {
        handleEdit('projects', [...resume.projects, {
            id: generateId(), name: 'Project', description: 'Description',
            technologies: ['Tech'], bullets: [], url: ''
        } as ProjectItem]);
    };

    const addEducation = () => {
        handleEdit('education', [...resume.education, {
            id: generateId(), institution: 'Institution', degree: 'Degree', field: 'Field', graduationDate: 'Year'
        } as EducationItem]);
    };

    const addCertification = () => {
        handleEdit('certifications', [...(resume.certifications || []), {
            id: generateId(), name: 'Certification', issuer: 'Issuer', date: 'Date'
        } as CertificationItem]);
    };

    const removeItem = (path: string, index: number) => {
        const arr = (resume as unknown as Record<string, unknown[]>)[path];
        if (Array.isArray(arr)) handleEdit(path, arr.filter((_, i) => i !== index));
    };

    const sectionOrder = resume.sectionOrder || ['header', 'summary', 'skills', 'experience', 'projects', 'education', 'certifications'];
    const sectionVisibility = resume.sectionVisibility || {};
    const isSectionVisible = (id: string) => sectionVisibility[id] !== false;

    const renderCustomSection = (section: CustomSection, sectionIndex: number) => {
        if (!section.visible) return null;
        const sectionPath = `customSections.${sectionIndex}`;
        return (
            <section key={section.id} className="mb-4">
                <h2 className="text-xs font-medium uppercase tracking-widest text-gray-500 mb-2">{section.title}</h2>
                {section.type === 'text' && (
                    <p className="text-sm text-gray-700" contentEditable={isEditing} suppressContentEditableWarning
                        onBlur={(e) => handleEdit(`${sectionPath}.content`, e.currentTarget.textContent || '')}>
                        {typeof section.content === 'string' ? section.content || 'Click to add...' : ''}
                    </p>
                )}
                {section.type === 'list' && (
                    <p className="text-sm text-gray-700">
                        {Array.isArray(section.content) && section.content.join(' · ')}
                        {isEditing && (
                            <button className="ml-2 text-gray-400 hover:text-gray-600 text-xs"
                                onClick={() => handleEdit(`${sectionPath}.content`, [...(Array.isArray(section.content) ? section.content : []), 'New'])}>+ Add</button>
                        )}
                    </p>
                )}
                {section.type === 'items' && (
                    <div className="space-y-1">
                        {Array.isArray(section.content) && section.content.map((item, i) => {
                            if (typeof item === 'string') return null;
                            const sectionItem = item as CustomSectionItem;
                            return (
                                <div key={sectionItem.id || i} className="group text-sm flex justify-between">
                                    <span>
                                        <span className="font-medium" contentEditable={isEditing} suppressContentEditableWarning
                                            onBlur={(e) => {
                                                const newContent = [...(section.content as CustomSectionItem[])];
                                                newContent[i] = { ...newContent[i], title: e.currentTarget.textContent || '' };
                                                handleEdit(`${sectionPath}.content`, newContent);
                                            }}>{sectionItem.title}</span>
                                        {sectionItem.description && <span className="text-gray-600"> — {sectionItem.description}</span>}
                                    </span>
                                    {isEditing && (
                                        <button className="text-red-400 opacity-0 group-hover:opacity-100"
                                            onClick={() => handleEdit(`${sectionPath}.content`, (section.content as CustomSectionItem[]).filter((_, idx) => idx !== i))}>
                                            <X className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                        {isEditing && (
                            <button className="text-gray-400 text-xs"
                                onClick={() => handleEdit(`${sectionPath}.content`, [...(Array.isArray(section.content) ? section.content : []), { id: generateId(), title: 'New', description: '' }])}>
                                + Add item
                            </button>
                        )}
                    </div>
                )}
            </section>
        );
    };

    const renderSection = (sectionId: string) => {
        const customIdx = (resume.customSections || []).findIndex(s => s.id === sectionId);
        if (customIdx >= 0) return renderCustomSection(resume.customSections[customIdx], customIdx);

        switch (sectionId) {
            case 'header':
                return (
                    <header key="header" className="mb-6">
                        <h1 className="text-2xl font-light text-gray-900 mb-0.5" contentEditable={isEditing} suppressContentEditableWarning
                            onBlur={(e) => handleEdit('header.name', e.currentTarget.textContent || '')}>
                            {resume.header.name || (isEditing ? 'Your Name' : '')}
                        </h1>
                        <p className="text-sm text-gray-600 mb-2" contentEditable={isEditing} suppressContentEditableWarning
                            onBlur={(e) => handleEdit('header.title', e.currentTarget.textContent || '')}>
                            {resume.header.title || (isEditing ? 'Title' : '')}
                        </p>
                        <div className="text-xs text-gray-500 space-x-2">
                            <span contentEditable={isEditing} suppressContentEditableWarning className={!resume.header.email && isEditing ? 'text-gray-400' : ''}
                                onBlur={(e) => handleEdit('header.email', e.currentTarget.textContent || '')}>
                                {resume.header.email || (isEditing ? 'email@example.com' : '')}
                            </span>
                            <span>·</span>
                            <span contentEditable={isEditing} suppressContentEditableWarning className={!resume.header.phone && isEditing ? 'text-gray-400' : ''}
                                onBlur={(e) => handleEdit('header.phone', e.currentTarget.textContent || '')}>
                                {resume.header.phone || (isEditing ? 'phone' : '')}
                            </span>
                            <span>·</span>
                            <span contentEditable={isEditing} suppressContentEditableWarning className={!resume.header.location && isEditing ? 'text-gray-400' : ''}
                                onBlur={(e) => handleEdit('header.location', e.currentTarget.textContent || '')}>
                                {resume.header.location || (isEditing ? 'location' : '')}
                            </span>
                        </div>
                    </header>
                );

            case 'summary':
                return (
                    <section key="summary" className="mb-4">
                        <p className="text-sm text-gray-700 leading-relaxed" contentEditable={isEditing} suppressContentEditableWarning
                            onBlur={(e) => handleEdit('summary', e.currentTarget.textContent || '')}>
                            {resume.summary || (isEditing ? 'Professional summary...' : '')}
                        </p>
                    </section>
                );

            case 'skills':
                return (
                    <section key="skills" className="mb-4">
                        <h2 className="text-xs font-medium uppercase tracking-widest text-gray-500 mb-2">Skills</h2>
                        <p className="text-sm text-gray-700">
                            {[...resume.skills.languages, ...resume.skills.frameworks, ...resume.skills.tools].join(' · ')}
                        </p>
                    </section>
                );

            case 'experience':
                return (
                    <section key="experience" className="mb-4">
                        <h2 className="text-xs font-medium uppercase tracking-widest text-gray-500 mb-2">Experience</h2>
                        <div className="space-y-3">
                            {resume.experience.map((exp, index) => (
                                <div key={exp.id || index} className="group relative">
                                    {isEditing && (
                                        <button className="absolute -right-2 -top-2 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center"
                                            onClick={() => removeItem('experience', index)}><X className="w-2 h-2" /></button>
                                    )}
                                    <div className="flex justify-between items-baseline">
                                        <h3 className="font-medium text-gray-900 text-sm" contentEditable={isEditing} suppressContentEditableWarning
                                            onBlur={(e) => handleEdit(`experience.${index}.title`, e.currentTarget.textContent || '')}>{exp.title}</h3>
                                        <span className="text-xs text-gray-500">
                                            <span contentEditable={isEditing} suppressContentEditableWarning
                                                onBlur={(e) => handleEdit(`experience.${index}.startDate`, e.currentTarget.textContent || '')}>{exp.startDate}</span>
                                            {' — '}
                                            <span contentEditable={isEditing} suppressContentEditableWarning
                                                onBlur={(e) => handleEdit(`experience.${index}.endDate`, e.currentTarget.textContent || '')}>{exp.current ? 'Present' : exp.endDate}</span>
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600" contentEditable={isEditing} suppressContentEditableWarning
                                        onBlur={(e) => handleEdit(`experience.${index}.company`, e.currentTarget.textContent || '')}>{exp.company}</p>
                                    <ul className="mt-1 text-sm text-gray-700">
                                        {exp.bullets.slice(0, 2).map((b, i) => (
                                            <li key={i} className="group/b flex items-start gap-1">
                                                <span>— </span>
                                                <span className="flex-1" contentEditable={isEditing} suppressContentEditableWarning
                                                    onBlur={(e) => handleEdit(`experience.${index}.bullets.${i}`, e.currentTarget.textContent || '')}>{b}</span>
                                                {isEditing && (
                                                    <button className="text-red-400 opacity-0 group-hover/b:opacity-100"
                                                        onClick={() => handleEdit(`experience.${index}.bullets`, exp.bullets.filter((_, idx) => idx !== i))}>
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                )}
                                            </li>
                                        ))}
                                        {isEditing && (
                                            <li><button className="text-gray-400 text-xs"
                                                onClick={() => handleEdit(`experience.${index}.bullets`, [...exp.bullets, 'New bullet'])}>+ Add bullet</button></li>
                                        )}
                                    </ul>
                                </div>
                            ))}
                            {isEditing && (
                                <button className="w-full py-2 border border-dashed border-gray-300 rounded text-gray-400 text-sm hover:bg-gray-50"
                                    onClick={addExperience}><Plus className="h-3 w-3 inline mr-1" />Add Experience</button>
                            )}
                        </div>
                    </section>
                );

            case 'projects':
                return (
                    <section key="projects" className="mb-4">
                        <h2 className="text-xs font-medium uppercase tracking-widest text-gray-500 mb-2">Projects</h2>
                        <div className="space-y-3">
                            {resume.projects.map((project, index) => (
                                <div key={project.id || index} className="group relative">
                                    {isEditing && (
                                        <button className="absolute -right-2 -top-2 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center"
                                            onClick={() => removeItem('projects', index)}><X className="w-2 h-2" /></button>
                                    )}
                                    <h3 className="font-medium text-gray-900 text-sm" contentEditable={isEditing} suppressContentEditableWarning
                                        onBlur={(e) => handleEdit(`projects.${index}.name`, e.currentTarget.textContent || '')}>{project.name}</h3>
                                    <p className="text-xs text-gray-500 mb-1">{project.technologies.join(' · ')}</p>
                                    <p className="text-sm text-gray-700" contentEditable={isEditing} suppressContentEditableWarning
                                        onBlur={(e) => handleEdit(`projects.${index}.description`, e.currentTarget.textContent || '')}>{project.description}</p>
                                </div>
                            ))}
                            {isEditing && (
                                <button className="w-full py-2 border border-dashed border-gray-300 rounded text-gray-400 text-sm hover:bg-gray-50"
                                    onClick={addProject}><Plus className="h-3 w-3 inline mr-1" />Add Project</button>
                            )}
                        </div>
                    </section>
                );

            case 'education':
                return (
                    <section key="education" className="mb-4">
                        <h2 className="text-xs font-medium uppercase tracking-widest text-gray-500 mb-2">Education</h2>
                        <div className="space-y-1">
                            {resume.education.map((edu, index) => (
                                <div key={edu.id || index} className="group relative text-sm">
                                    {isEditing && (
                                        <button className="absolute -right-2 -top-1 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center"
                                            onClick={() => removeItem('education', index)}><X className="w-2 h-2" /></button>
                                    )}
                                    <span className="font-medium" contentEditable={isEditing} suppressContentEditableWarning
                                        onBlur={(e) => handleEdit(`education.${index}.degree`, e.currentTarget.textContent || '')}>{edu.degree}</span>
                                    {' in '}
                                    <span contentEditable={isEditing} suppressContentEditableWarning
                                        onBlur={(e) => handleEdit(`education.${index}.field`, e.currentTarget.textContent || '')}>{edu.field}</span>
                                    <span className="text-gray-600"> — </span>
                                    <span contentEditable={isEditing} suppressContentEditableWarning
                                        onBlur={(e) => handleEdit(`education.${index}.institution`, e.currentTarget.textContent || '')}>{edu.institution}</span>
                                </div>
                            ))}
                            {isEditing && (
                                <button className="w-full py-2 border border-dashed border-gray-300 rounded text-gray-400 text-sm hover:bg-gray-50"
                                    onClick={addEducation}><Plus className="h-3 w-3 inline mr-1" />Add Education</button>
                            )}
                        </div>
                    </section>
                );

            case 'certifications':
                if (!isEditing && (!resume.certifications || resume.certifications.length === 0)) return null;
                return (
                    <section key="certifications" className="mb-4">
                        <h2 className="text-xs font-medium uppercase tracking-widest text-gray-500 mb-2">Certifications</h2>
                        <p className="text-sm text-gray-700">
                            {(resume.certifications || []).map(c => c.name).join(' · ')}
                        </p>
                        {isEditing && (
                            <button className="mt-2 w-full py-2 border border-dashed border-gray-300 rounded text-gray-400 text-sm hover:bg-gray-50"
                                onClick={addCertification}><Plus className="h-3 w-3 inline mr-1" />Add Certification</button>
                        )}
                    </section>
                );

            default: return null;
        }
    };

    return (
        <div className="resume-page shadow-2xl mx-auto bg-white" style={{ padding: '40px 50px' }}>
            {sectionOrder.filter(id => isSectionVisible(id)).map(id => renderSection(id))}
        </div>
    );
}
