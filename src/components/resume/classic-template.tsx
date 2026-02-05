/**
 * Classic Resume Template Component
 * 
 * Traditional, formal resume template with full editing support
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

export function ClassicTemplate({ resume, isEditing = false, onUpdate }: ResumeTemplateProps) {
    const handleEdit = (path: string, value: unknown) => {
        if (isEditing && onUpdate) {
            onUpdate(path, value);
        }
    };

    // Add functions
    const addExperience = () => {
        const newItem: ExperienceItem = {
            id: generateId(), company: 'Company Name', title: 'Job Title',
            location: 'Location', startDate: 'Start Date', endDate: 'End Date',
            current: false, bullets: ['Describe your responsibilities']
        };
        handleEdit('experience', [...resume.experience, newItem]);
    };

    const addProject = () => {
        const newItem: ProjectItem = {
            id: generateId(), name: 'Project Name', description: 'Brief description',
            technologies: ['Technology'], bullets: ['Key achievement'], url: ''
        };
        handleEdit('projects', [...resume.projects, newItem]);
    };

    const addEducation = () => {
        const newItem: EducationItem = {
            id: generateId(), institution: 'Institution', degree: 'Degree',
            field: 'Field of Study', graduationDate: 'Year'
        };
        handleEdit('education', [...resume.education, newItem]);
    };

    const addCertification = () => {
        const newItem: CertificationItem = {
            id: generateId(), name: 'Certification', issuer: 'Issuer', date: 'Date'
        };
        handleEdit('certifications', [...(resume.certifications || []), newItem]);
    };

    const removeItem = (path: string, index: number) => {
        const arr = (resume as unknown as Record<string, unknown[]>)[path];
        if (Array.isArray(arr)) handleEdit(path, arr.filter((_, i) => i !== index));
    };

    const addBullet = (basePath: string, bullets: string[]) => {
        handleEdit(`${basePath}.bullets`, [...bullets, 'New bullet point']);
    };

    const removeBullet = (basePath: string, bullets: string[], index: number) => {
        handleEdit(`${basePath}.bullets`, bullets.filter((_, i) => i !== index));
    };

    const sectionOrder = resume.sectionOrder || ['header', 'summary', 'skills', 'experience', 'projects', 'education', 'certifications'];
    const sectionVisibility = resume.sectionVisibility || {};
    const isSectionVisible = (id: string) => sectionVisibility[id] !== false;

    const renderCustomSection = (section: CustomSection, sectionIndex: number) => {
        if (!section.visible) return null;
        const sectionPath = `customSections.${sectionIndex}`;

        return (
            <section key={section.id} className="mb-5">
                <h2 className="text-base font-bold uppercase text-gray-900 border-b-2 border-gray-900 pb-1 mb-3">
                    {section.icon} {section.title}
                </h2>
                {section.type === 'text' && (
                    <p className="text-sm text-gray-800" contentEditable={isEditing} suppressContentEditableWarning
                        onBlur={(e) => handleEdit(`${sectionPath}.content`, e.currentTarget.textContent || '')}>
                        {typeof section.content === 'string' ? section.content || 'Click to add content...' : ''}
                    </p>
                )}
                {section.type === 'list' && (
                    <div className="flex flex-wrap gap-2">
                        {Array.isArray(section.content) && section.content.map((item, i) => (
                            typeof item === 'string' && (
                                <span key={i} className="group relative px-2 py-1 bg-gray-100 text-sm">
                                    <span contentEditable={isEditing} suppressContentEditableWarning
                                        onBlur={(e) => {
                                            const newContent = [...(section.content as string[])];
                                            newContent[i] = e.currentTarget.textContent || '';
                                            handleEdit(`${sectionPath}.content`, newContent);
                                        }}>{item}</span>
                                    {isEditing && (
                                        <button className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100"
                                            onClick={() => handleEdit(`${sectionPath}.content`, (section.content as string[]).filter((_, idx) => idx !== i))}>
                                            <X className="w-2 h-2 mx-auto" />
                                        </button>
                                    )}
                                </span>
                            )
                        ))}
                        {isEditing && (
                            <button className="px-2 py-1 border border-dashed text-sm text-gray-500 hover:bg-gray-50"
                                onClick={() => handleEdit(`${sectionPath}.content`, [...(Array.isArray(section.content) ? section.content : []), 'New Item'])}>
                                + Add
                            </button>
                        )}
                    </div>
                )}
                {section.type === 'items' && (
                    <div className="space-y-2">
                        {Array.isArray(section.content) && section.content.map((item, i) => {
                            if (typeof item === 'string') return null;
                            const sectionItem = item as CustomSectionItem;
                            return (
                                <div key={sectionItem.id || i} className="group flex justify-between">
                                    <div className="flex-1">
                                        <span className="font-semibold text-sm" contentEditable={isEditing} suppressContentEditableWarning
                                            onBlur={(e) => {
                                                const newContent = [...(section.content as CustomSectionItem[])];
                                                newContent[i] = { ...newContent[i], title: e.currentTarget.textContent || '' };
                                                handleEdit(`${sectionPath}.content`, newContent);
                                            }}>{sectionItem.title}</span>
                                        {sectionItem.description && (
                                            <span className="text-sm text-gray-600" contentEditable={isEditing} suppressContentEditableWarning
                                                onBlur={(e) => {
                                                    const newContent = [...(section.content as CustomSectionItem[])];
                                                    newContent[i] = { ...newContent[i], description: e.currentTarget.textContent || '' };
                                                    handleEdit(`${sectionPath}.content`, newContent);
                                                }}> — {sectionItem.description}</span>
                                        )}
                                    </div>
                                    {isEditing && (
                                        <button className="text-red-400 hover:text-red-500 opacity-0 group-hover:opacity-100"
                                            onClick={() => handleEdit(`${sectionPath}.content`, (section.content as CustomSectionItem[]).filter((_, idx) => idx !== i))}>
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                        {isEditing && (
                            <button className="text-gray-500 text-sm flex items-center gap-1"
                                onClick={() => handleEdit(`${sectionPath}.content`, [...(Array.isArray(section.content) ? section.content : []), { id: generateId(), title: 'New Item', description: '' }])}>
                                <Plus className="h-3 w-3" /> Add item
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
                    <header key="header" className="text-center mb-6 border-b-2 border-gray-900 pb-4">
                        <h1 className="text-3xl font-bold uppercase tracking-wide text-gray-900 mb-1"
                            contentEditable={isEditing} suppressContentEditableWarning
                            onBlur={(e) => handleEdit('header.name', e.currentTarget.textContent || '')}>
                            {resume.header.name || (isEditing ? 'Your Name' : '')}
                        </h1>
                        <p className="text-lg text-gray-700 mb-2" contentEditable={isEditing} suppressContentEditableWarning
                            onBlur={(e) => handleEdit('header.title', e.currentTarget.textContent || '')}>
                            {resume.header.title || (isEditing ? 'Professional Title' : '')}
                        </p>
                        <div className="flex flex-wrap justify-center gap-3 text-sm text-gray-600">
                            <span contentEditable={isEditing} suppressContentEditableWarning className={!resume.header.email && isEditing ? 'text-gray-400' : ''}
                                onBlur={(e) => handleEdit('header.email', e.currentTarget.textContent || '')}>
                                {resume.header.email || (isEditing ? 'email@example.com' : '')}
                            </span>
                            <span>|</span>
                            <span contentEditable={isEditing} suppressContentEditableWarning className={!resume.header.phone && isEditing ? 'text-gray-400' : ''}
                                onBlur={(e) => handleEdit('header.phone', e.currentTarget.textContent || '')}>
                                {resume.header.phone || (isEditing ? '+1 (555) 123-4567' : '')}
                            </span>
                            <span>|</span>
                            <span contentEditable={isEditing} suppressContentEditableWarning className={!resume.header.location && isEditing ? 'text-gray-400' : ''}
                                onBlur={(e) => handleEdit('header.location', e.currentTarget.textContent || '')}>
                                {resume.header.location || (isEditing ? 'City, Country' : '')}
                            </span>
                        </div>
                    </header>
                );

            case 'summary':
                return (
                    <section key="summary" className="mb-5">
                        <h2 className="text-base font-bold uppercase text-gray-900 border-b-2 border-gray-900 pb-1 mb-3">Professional Summary</h2>
                        <p className="text-gray-800 text-sm leading-relaxed" contentEditable={isEditing} suppressContentEditableWarning
                            onBlur={(e) => handleEdit('summary', e.currentTarget.textContent || '')}>
                            {resume.summary || (isEditing ? 'Write your professional summary here...' : '')}
                        </p>
                    </section>
                );

            case 'skills':
                return (
                    <section key="skills" className="mb-5">
                        <h2 className="text-base font-bold uppercase text-gray-900 border-b-2 border-gray-900 pb-1 mb-3">Technical Skills</h2>
                        <div className="text-sm space-y-1">
                            {(resume.skills.categories || []).map(cat => (
                                cat.items.length > 0 && <p key={cat.id}><strong>{cat.name}:</strong> {cat.items.join(', ')}</p>
                            ))}
                        </div>
                    </section>
                );

            case 'experience':
                return (
                    <section key="experience" className="mb-5">
                        <h2 className="text-base font-bold uppercase text-gray-900 border-b-2 border-gray-900 pb-1 mb-3">Work Experience</h2>
                        <div className="space-y-3">
                            {resume.experience.map((exp, index) => (
                                <div key={exp.id || index} className="group relative">
                                    {isEditing && (
                                        <button className="absolute -right-2 -top-2 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center"
                                            onClick={() => removeItem('experience', index)}><X className="w-3 h-3" /></button>
                                    )}
                                    <div className="flex justify-between items-baseline">
                                        <h3 className="font-bold text-gray-900" contentEditable={isEditing} suppressContentEditableWarning
                                            onBlur={(e) => handleEdit(`experience.${index}.title`, e.currentTarget.textContent || '')}>{exp.title}</h3>
                                        <span className="text-sm text-gray-600">
                                            <span contentEditable={isEditing} suppressContentEditableWarning
                                                onBlur={(e) => handleEdit(`experience.${index}.startDate`, e.currentTarget.textContent || '')}>{exp.startDate}</span>
                                            {' - '}
                                            <span contentEditable={isEditing} suppressContentEditableWarning
                                                onBlur={(e) => handleEdit(`experience.${index}.endDate`, e.currentTarget.textContent || '')}>{exp.current ? 'Present' : exp.endDate}</span>
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700 italic" contentEditable={isEditing} suppressContentEditableWarning
                                        onBlur={(e) => handleEdit(`experience.${index}.company`, e.currentTarget.textContent || '')}>{exp.company}</p>
                                    <ul className="mt-1 text-sm text-gray-700 list-disc list-inside">
                                        {exp.bullets.map((b, i) => (
                                            <li key={i} className="group/bullet flex items-start gap-1">
                                                <span className="flex-1" contentEditable={isEditing} suppressContentEditableWarning
                                                    onBlur={(e) => handleEdit(`experience.${index}.bullets.${i}`, e.currentTarget.textContent || '')}>{b}</span>
                                                {isEditing && (
                                                    <button className="text-red-400 opacity-0 group-hover/bullet:opacity-100"
                                                        onClick={() => removeBullet(`experience.${index}`, exp.bullets, i)}><Trash2 className="h-3 w-3" /></button>
                                                )}
                                            </li>
                                        ))}
                                        {isEditing && (
                                            <li className="list-none"><button className="text-gray-500 text-xs flex items-center gap-1"
                                                onClick={() => addBullet(`experience.${index}`, exp.bullets)}><Plus className="h-3 w-3" /> Add bullet</button></li>
                                        )}
                                    </ul>
                                </div>
                            ))}
                            {isEditing && (
                                <button className="w-full py-2 border-2 border-dashed border-gray-400 rounded text-gray-500 hover:bg-gray-50 flex items-center justify-center gap-2"
                                    onClick={addExperience}><Plus className="h-4 w-4" /> Add Experience</button>
                            )}
                        </div>
                    </section>
                );

            case 'projects':
                return (
                    <section key="projects" className="mb-5">
                        <h2 className="text-base font-bold uppercase text-gray-900 border-b-2 border-gray-900 pb-1 mb-3">Projects</h2>
                        <div className="space-y-3">
                            {resume.projects.map((project, index) => (
                                <div key={project.id || index} className="group relative">
                                    {isEditing && (
                                        <button className="absolute -right-2 -top-2 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center"
                                            onClick={() => removeItem('projects', index)}><X className="w-3 h-3" /></button>
                                    )}
                                    <div className="flex justify-between items-baseline">
                                        <h3 className="font-bold text-gray-900" contentEditable={isEditing} suppressContentEditableWarning
                                            onBlur={(e) => handleEdit(`projects.${index}.name`, e.currentTarget.textContent || '')}>{project.name}</h3>
                                        <span className="text-xs text-gray-600">{project.technologies.slice(0, 3).join(', ')}</span>
                                    </div>
                                    <p className="text-sm text-gray-700 mt-1" contentEditable={isEditing} suppressContentEditableWarning
                                        onBlur={(e) => handleEdit(`projects.${index}.description`, e.currentTarget.textContent || '')}>{project.description}</p>
                                </div>
                            ))}
                            {isEditing && (
                                <button className="w-full py-2 border-2 border-dashed border-gray-400 rounded text-gray-500 hover:bg-gray-50 flex items-center justify-center gap-2"
                                    onClick={addProject}><Plus className="h-4 w-4" /> Add Project</button>
                            )}
                        </div>
                    </section>
                );

            case 'education':
                return (
                    <section key="education" className="mb-5">
                        <h2 className="text-base font-bold uppercase text-gray-900 border-b-2 border-gray-900 pb-1 mb-3">Education</h2>
                        <div className="space-y-2">
                            {resume.education.map((edu, index) => (
                                <div key={edu.id || index} className="group relative flex justify-between">
                                    {isEditing && (
                                        <button className="absolute -right-2 -top-2 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center"
                                            onClick={() => removeItem('education', index)}><X className="w-3 h-3" /></button>
                                    )}
                                    <div>
                                        <h3 className="font-bold text-gray-900">
                                            <span contentEditable={isEditing} suppressContentEditableWarning
                                                onBlur={(e) => handleEdit(`education.${index}.degree`, e.currentTarget.textContent || '')}>{edu.degree}</span>
                                            {' in '}
                                            <span contentEditable={isEditing} suppressContentEditableWarning
                                                onBlur={(e) => handleEdit(`education.${index}.field`, e.currentTarget.textContent || '')}>{edu.field}</span>
                                        </h3>
                                        <p className="text-sm text-gray-700" contentEditable={isEditing} suppressContentEditableWarning
                                            onBlur={(e) => handleEdit(`education.${index}.institution`, e.currentTarget.textContent || '')}>{edu.institution}</p>
                                    </div>
                                    <span className="text-sm text-gray-600" contentEditable={isEditing} suppressContentEditableWarning
                                        onBlur={(e) => handleEdit(`education.${index}.graduationDate`, e.currentTarget.textContent || '')}>{edu.graduationDate}</span>
                                </div>
                            ))}
                            {isEditing && (
                                <button className="w-full py-2 border-2 border-dashed border-gray-400 rounded text-gray-500 hover:bg-gray-50 flex items-center justify-center gap-2"
                                    onClick={addEducation}><Plus className="h-4 w-4" /> Add Education</button>
                            )}
                        </div>
                    </section>
                );

            case 'certifications':
                return (
                    <section key="certifications" className="mb-5">
                        <h2 className="text-base font-bold uppercase text-gray-900 border-b-2 border-gray-900 pb-1 mb-3">Certifications</h2>
                        <div className="space-y-1">
                            {(resume.certifications || []).map((cert, index) => (
                                <div key={cert.id || index} className="group relative flex justify-between text-sm">
                                    {isEditing && (
                                        <button className="absolute -right-2 -top-1 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center"
                                            onClick={() => handleEdit('certifications', (resume.certifications || []).filter((_, i) => i !== index))}><X className="w-2 h-2" /></button>
                                    )}
                                    <span>
                                        <strong contentEditable={isEditing} suppressContentEditableWarning
                                            onBlur={(e) => handleEdit(`certifications.${index}.name`, e.currentTarget.textContent || '')}>{cert.name}</strong>
                                        {' - '}
                                        <span contentEditable={isEditing} suppressContentEditableWarning
                                            onBlur={(e) => handleEdit(`certifications.${index}.issuer`, e.currentTarget.textContent || '')}>{cert.issuer}</span>
                                    </span>
                                    <span className="text-gray-600" contentEditable={isEditing} suppressContentEditableWarning
                                        onBlur={(e) => handleEdit(`certifications.${index}.date`, e.currentTarget.textContent || '')}>{cert.date}</span>
                                </div>
                            ))}
                            {isEditing && (
                                <button className="w-full py-2 border-2 border-dashed border-gray-400 rounded text-gray-500 hover:bg-gray-50 flex items-center justify-center gap-2"
                                    onClick={addCertification}><Plus className="h-4 w-4" /> Add Certification</button>
                            )}
                        </div>
                    </section>
                );

            default: return null;
        }
    };

    return (
        <div className="resume-page shadow-2xl mx-auto bg-white" style={{ fontFamily: 'Georgia, Times, serif' }}>
            {sectionOrder.filter(id => isSectionVisible(id)).map(id => renderSection(id))}
        </div>
    );
}
