/**
 * Creative Resume Template Component
 * 
 * Colorful, modern template with full editing support
 */

'use client';

import { Resume, CustomSection, CustomSectionItem, ExperienceItem, ProjectItem, EducationItem, CertificationItem } from '@/types';
import { Mail, MapPin, Github, Phone, ExternalLink, Plus, Trash2, X } from 'lucide-react';

interface ResumeTemplateProps {
    resume: Resume;
    isEditing?: boolean;
    onUpdate?: (path: string, value: unknown) => void;
}

const generateId = () => `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function CreativeTemplate({ resume, isEditing = false, onUpdate }: ResumeTemplateProps) {
    const handleEdit = (path: string, value: unknown) => {
        if (isEditing && onUpdate) onUpdate(path, value);
    };

    const addExperience = () => {
        handleEdit('experience', [...resume.experience, {
            id: generateId(), company: 'Company', title: 'Title', location: '',
            startDate: 'Start', endDate: 'End', current: false, bullets: ['Achievement']
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

    const addBullet = (basePath: string, bullets: string[]) => {
        handleEdit(`${basePath}.bullets`, [...bullets, 'New achievement']);
    };

    const sectionOrder = resume.sectionOrder || ['header', 'summary', 'skills', 'experience', 'projects', 'education', 'certifications'];
    const sectionVisibility = resume.sectionVisibility || {};
    const isSectionVisible = (id: string) => sectionVisibility[id] !== false;

    const renderCustomSection = (section: CustomSection, sectionIndex: number) => {
        if (!section.visible) return null;
        const sectionPath = `customSections.${sectionIndex}`;
        return (
            <section key={section.id} className="mb-5">
                <h2 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-500 uppercase tracking-wider mb-3">
                    {section.icon} {section.title}
                </h2>
                {section.type === 'text' && (
                    <p className="text-sm text-gray-700" contentEditable={isEditing} suppressContentEditableWarning
                        onBlur={(e) => handleEdit(`${sectionPath}.content`, e.currentTarget.textContent || '')}>
                        {typeof section.content === 'string' ? section.content || 'Click to add...' : ''}
                    </p>
                )}
                {section.type === 'list' && (
                    <div className="flex flex-wrap gap-2">
                        {Array.isArray(section.content) && section.content.map((item, i) => (
                            typeof item === 'string' && (
                                <span key={i} className="group relative px-3 py-1 text-xs rounded-full bg-gradient-to-r from-pink-100 to-orange-100 text-pink-700">
                                    <span contentEditable={isEditing} suppressContentEditableWarning
                                        onBlur={(e) => {
                                            const newContent = [...(section.content as string[])];
                                            newContent[i] = e.currentTarget.textContent || '';
                                            handleEdit(`${sectionPath}.content`, newContent);
                                        }}>{item}</span>
                                    {isEditing && (
                                        <button className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100"
                                            onClick={() => handleEdit(`${sectionPath}.content`, (section.content as string[]).filter((_, idx) => idx !== i))}>
                                            <X className="w-2 h-2 mx-auto" />
                                        </button>
                                    )}
                                </span>
                            )
                        ))}
                        {isEditing && (
                            <button className="px-3 py-1 text-xs rounded-full border border-dashed border-pink-300 text-pink-500"
                                onClick={() => handleEdit(`${sectionPath}.content`, [...(Array.isArray(section.content) ? section.content : []), 'New'])}>+ Add</button>
                        )}
                    </div>
                )}
                {section.type === 'items' && (
                    <div className="space-y-2">
                        {Array.isArray(section.content) && section.content.map((item, i) => {
                            if (typeof item === 'string') return null;
                            const sectionItem = item as CustomSectionItem;
                            return (
                                <div key={sectionItem.id || i} className="group border-l-2 border-pink-400 pl-3">
                                    <h3 className="font-medium text-gray-900 text-sm" contentEditable={isEditing} suppressContentEditableWarning
                                        onBlur={(e) => {
                                            const newContent = [...(section.content as CustomSectionItem[])];
                                            newContent[i] = { ...newContent[i], title: e.currentTarget.textContent || '' };
                                            handleEdit(`${sectionPath}.content`, newContent);
                                        }}>{sectionItem.title}</h3>
                                    {sectionItem.description && <p className="text-xs text-gray-600">{sectionItem.description}</p>}
                                    {isEditing && (
                                        <button className="text-red-400 text-xs opacity-0 group-hover:opacity-100"
                                            onClick={() => handleEdit(`${sectionPath}.content`, (section.content as CustomSectionItem[]).filter((_, idx) => idx !== i))}>Remove</button>
                                    )}
                                </div>
                            );
                        })}
                        {isEditing && (
                            <button className="text-pink-500 text-xs"
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
                    <header key="header" className="mb-6 relative">
                        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-pink-500 via-purple-500 to-orange-500 rounded-full" />
                        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 mb-1"
                            contentEditable={isEditing} suppressContentEditableWarning
                            onBlur={(e) => handleEdit('header.name', e.currentTarget.textContent || '')}>
                            {resume.header.name || (isEditing ? 'Your Name' : '')}
                        </h1>
                        <p className="text-lg font-medium text-gray-700 mb-3" contentEditable={isEditing} suppressContentEditableWarning
                            onBlur={(e) => handleEdit('header.title', e.currentTarget.textContent || '')}>
                            {resume.header.title || (isEditing ? 'Title' : '')}
                        </p>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-50">
                                <Mail className="h-3 w-3 text-pink-500" />
                                <span contentEditable={isEditing} suppressContentEditableWarning className={!resume.header.email && isEditing ? 'text-gray-400' : ''}
                                    onBlur={(e) => handleEdit('header.email', e.currentTarget.textContent || '')}>
                                    {resume.header.email || (isEditing ? 'email@example.com' : '')}
                                </span>
                            </span>
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50">
                                <Phone className="h-3 w-3 text-purple-500" />
                                <span contentEditable={isEditing} suppressContentEditableWarning className={!resume.header.phone && isEditing ? 'text-gray-400' : ''}
                                    onBlur={(e) => handleEdit('header.phone', e.currentTarget.textContent || '')}>
                                    {resume.header.phone || (isEditing ? 'phone' : '')}
                                </span>
                            </span>
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50">
                                <MapPin className="h-3 w-3 text-orange-500" />
                                <span contentEditable={isEditing} suppressContentEditableWarning className={!resume.header.location && isEditing ? 'text-gray-400' : ''}
                                    onBlur={(e) => handleEdit('header.location', e.currentTarget.textContent || '')}>
                                    {resume.header.location || (isEditing ? 'location' : '')}
                                </span>
                            </span>
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100">
                                <Github className="h-3 w-3" />
                                <span contentEditable={isEditing} suppressContentEditableWarning className={!resume.header.github && isEditing ? 'text-gray-400' : ''}
                                    onBlur={(e) => handleEdit('header.github', e.currentTarget.textContent || '')}>
                                    {resume.header.github || (isEditing ? 'github' : '')}
                                </span>
                            </span>
                        </div>
                    </header>
                );

            case 'summary':
                return (
                    <section key="summary" className="mb-5">
                        <p className="text-sm text-gray-700 leading-relaxed italic border-l-4 border-purple-200 pl-4"
                            contentEditable={isEditing} suppressContentEditableWarning
                            onBlur={(e) => handleEdit('summary', e.currentTarget.textContent || '')}>
                            {resume.summary || (isEditing ? 'Professional summary...' : '')}
                        </p>
                    </section>
                );

            case 'skills':
                return (
                    <section key="skills" className="mb-5">
                        <h2 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-500 uppercase tracking-wider mb-3">Skills</h2>
                        <div className="flex flex-wrap gap-2">
                            {(resume.skills.categories || []).flatMap(cat => cat.items).map((skill, i) => (
                                <span key={i} className="px-3 py-1 text-xs rounded-full bg-gradient-to-r from-pink-100 to-orange-100 text-pink-700 font-medium">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </section>
                );

            case 'experience':
                return (
                    <section key="experience" className="mb-5">
                        <h2 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-500 uppercase tracking-wider mb-3">Experience</h2>
                        <div className="space-y-4">
                            {resume.experience.map((exp, index) => (
                                <div key={exp.id || index} className="group relative pl-4 border-l-2 border-purple-200">
                                    {isEditing && (
                                        <button className="absolute -right-2 -top-2 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center"
                                            onClick={() => removeItem('experience', index)}><X className="w-3 h-3" /></button>
                                    )}
                                    <div className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500" />
                                    <div className="flex justify-between items-baseline">
                                        <h3 className="font-bold text-gray-900" contentEditable={isEditing} suppressContentEditableWarning
                                            onBlur={(e) => handleEdit(`experience.${index}.title`, e.currentTarget.textContent || '')}>{exp.title}</h3>
                                        <span className="text-xs text-gray-500">
                                            <span contentEditable={isEditing} suppressContentEditableWarning
                                                onBlur={(e) => handleEdit(`experience.${index}.startDate`, e.currentTarget.textContent || '')}>{exp.startDate}</span>
                                            {' — '}
                                            <span contentEditable={isEditing} suppressContentEditableWarning
                                                onBlur={(e) => handleEdit(`experience.${index}.endDate`, e.currentTarget.textContent || '')}>{exp.current ? 'Present' : exp.endDate}</span>
                                        </span>
                                    </div>
                                    <p className="text-sm text-purple-600 font-medium" contentEditable={isEditing} suppressContentEditableWarning
                                        onBlur={(e) => handleEdit(`experience.${index}.company`, e.currentTarget.textContent || '')}>{exp.company}</p>
                                    <ul className="mt-2 text-sm text-gray-700 space-y-1">
                                        {exp.bullets.map((b, i) => (
                                            <li key={i} className="group/b flex items-start gap-2">
                                                <span className="text-pink-500 mt-0.5">→</span>
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
                                            <li><button className="text-pink-500 text-xs"
                                                onClick={() => addBullet(`experience.${index}`, exp.bullets)}>+ Add bullet</button></li>
                                        )}
                                    </ul>
                                </div>
                            ))}
                            {isEditing && (
                                <button className="w-full py-2 border-2 border-dashed border-pink-200 rounded-lg text-pink-500 hover:bg-pink-50 flex items-center justify-center gap-2"
                                    onClick={addExperience}><Plus className="h-4 w-4" /> Add Experience</button>
                            )}
                        </div>
                    </section>
                );

            case 'projects':
                return (
                    <section key="projects" className="mb-5">
                        <h2 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-500 uppercase tracking-wider mb-3">Projects</h2>
                        <div className="grid grid-cols-1 gap-4">
                            {resume.projects.map((project, index) => (
                                <div key={project.id || index} className="group relative p-3 rounded-lg bg-gradient-to-br from-pink-50 to-orange-50 border border-pink-100">
                                    {isEditing && (
                                        <button className="absolute -right-2 -top-2 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center"
                                            onClick={() => removeItem('projects', index)}><X className="w-3 h-3" /></button>
                                    )}
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-bold text-gray-900" contentEditable={isEditing} suppressContentEditableWarning
                                            onBlur={(e) => handleEdit(`projects.${index}.name`, e.currentTarget.textContent || '')}>{project.name}</h3>
                                        {project.url && (
                                            <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-pink-500">
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {project.technologies.slice(0, 4).map((tech, i) => (
                                            <span key={i} className="text-xs px-2 py-0.5 rounded bg-white text-pink-600">{tech}</span>
                                        ))}
                                    </div>
                                    <p className="text-sm text-gray-700" contentEditable={isEditing} suppressContentEditableWarning
                                        onBlur={(e) => handleEdit(`projects.${index}.description`, e.currentTarget.textContent || '')}>{project.description}</p>
                                </div>
                            ))}
                            {isEditing && (
                                <button className="w-full py-2 border-2 border-dashed border-pink-200 rounded-lg text-pink-500 hover:bg-pink-50 flex items-center justify-center gap-2"
                                    onClick={addProject}><Plus className="h-4 w-4" /> Add Project</button>
                            )}
                        </div>
                    </section>
                );

            case 'education':
                return (
                    <section key="education" className="mb-5">
                        <h2 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-500 uppercase tracking-wider mb-3">Education</h2>
                        <div className="space-y-2">
                            {resume.education.map((edu, index) => (
                                <div key={edu.id || index} className="group relative flex justify-between items-baseline">
                                    {isEditing && (
                                        <button className="absolute -right-2 -top-1 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center"
                                            onClick={() => removeItem('education', index)}><X className="w-2 h-2" /></button>
                                    )}
                                    <div>
                                        <h3 className="font-bold text-gray-900">
                                            <span contentEditable={isEditing} suppressContentEditableWarning
                                                onBlur={(e) => handleEdit(`education.${index}.degree`, e.currentTarget.textContent || '')}>{edu.degree}</span>
                                            {' in '}
                                            <span contentEditable={isEditing} suppressContentEditableWarning
                                                onBlur={(e) => handleEdit(`education.${index}.field`, e.currentTarget.textContent || '')}>{edu.field}</span>
                                        </h3>
                                        <p className="text-sm text-gray-600" contentEditable={isEditing} suppressContentEditableWarning
                                            onBlur={(e) => handleEdit(`education.${index}.institution`, e.currentTarget.textContent || '')}>{edu.institution}</p>
                                    </div>
                                    <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-600" contentEditable={isEditing} suppressContentEditableWarning
                                        onBlur={(e) => handleEdit(`education.${index}.graduationDate`, e.currentTarget.textContent || '')}>{edu.graduationDate}</span>
                                </div>
                            ))}
                            {isEditing && (
                                <button className="w-full py-2 border-2 border-dashed border-pink-200 rounded-lg text-pink-500 hover:bg-pink-50 flex items-center justify-center gap-2"
                                    onClick={addEducation}><Plus className="h-4 w-4" /> Add Education</button>
                            )}
                        </div>
                    </section>
                );

            case 'certifications':
                if (!isEditing && (!resume.certifications || resume.certifications.length === 0)) return null;
                return (
                    <section key="certifications" className="mb-5">
                        <h2 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-500 uppercase tracking-wider mb-3">Certifications</h2>
                        <div className="flex flex-wrap gap-2">
                            {(resume.certifications || []).map((cert, index) => (
                                <span key={cert.id || index} className="group relative px-3 py-1 text-xs rounded-full bg-gradient-to-r from-orange-100 to-pink-100 text-orange-700">
                                    🏅 <span contentEditable={isEditing} suppressContentEditableWarning
                                        onBlur={(e) => handleEdit(`certifications.${index}.name`, e.currentTarget.textContent || '')}>{cert.name}</span>
                                    {isEditing && (
                                        <button className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100"
                                            onClick={() => handleEdit('certifications', (resume.certifications || []).filter((_, i) => i !== index))}>
                                            <X className="w-2 h-2 mx-auto" />
                                        </button>
                                    )}
                                </span>
                            ))}
                        </div>
                        {isEditing && (
                            <button className="mt-2 w-full py-2 border-2 border-dashed border-pink-200 rounded-lg text-pink-500 hover:bg-pink-50 flex items-center justify-center gap-2"
                                onClick={addCertification}><Plus className="h-4 w-4" /> Add Certification</button>
                        )}
                    </section>
                );

            default: return null;
        }
    };

    return (
        <div className="resume-page shadow-2xl mx-auto bg-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-pink-100 via-purple-100 to-transparent opacity-50" />
            <div className="relative z-10">
                {sectionOrder.filter(id => isSectionVisible(id)).map(id => renderSection(id))}
            </div>
        </div>
    );
}
