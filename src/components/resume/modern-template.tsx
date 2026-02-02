/**
 * Modern Resume Template Component
 * 
 * A clean, two-column resume template with gradient accents
 */

'use client';

import { Resume } from '@/types';
import { Badge } from '@/components/ui/badge';
import {
    Mail,
    MapPin,
    Github,
    Linkedin,
    Globe,
    Phone,
    ExternalLink
} from 'lucide-react';

interface ResumeTemplateProps {
    resume: Resume;
    isEditing?: boolean;
    onUpdate?: (path: string, value: unknown) => void;
}

export function ModernTemplate({ resume, isEditing = false, onUpdate }: ResumeTemplateProps) {
    const handleEdit = (path: string, value: string) => {
        if (isEditing && onUpdate) {
            onUpdate(path, value);
        }
    };

    return (
        <div className="resume-page shadow-2xl mx-auto">
            {/* Header */}
            <header className="mb-6">
                <h1
                    className="text-3xl font-bold text-gray-900 mb-1"
                    contentEditable={isEditing}
                    suppressContentEditableWarning
                    onBlur={(e) => handleEdit('header.name', e.currentTarget.textContent || '')}
                    data-placeholder="Your Name"
                >
                    {resume.header.name}
                </h1>
                <p
                    className="text-lg font-medium text-purple-600 mb-3"
                    contentEditable={isEditing}
                    suppressContentEditableWarning
                    onBlur={(e) => handleEdit('header.title', e.currentTarget.textContent || '')}
                    data-placeholder="Job Title"
                >
                    {resume.header.title}
                </p>

                {/* Contact Info */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    {resume.header.email && (
                        <span className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" />
                            {resume.header.email}
                        </span>
                    )}
                    {resume.header.phone && (
                        <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            {resume.header.phone}
                        </span>
                    )}
                    {resume.header.location && (
                        <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {resume.header.location}
                        </span>
                    )}
                    {resume.header.github && (
                        <span className="flex items-center gap-1">
                            <Github className="h-3.5 w-3.5" />
                            {resume.header.github}
                        </span>
                    )}
                    {resume.header.linkedin && (
                        <span className="flex items-center gap-1">
                            <Linkedin className="h-3.5 w-3.5" />
                            {resume.header.linkedin}
                        </span>
                    )}
                    {resume.header.portfolio && (
                        <span className="flex items-center gap-1">
                            <Globe className="h-3.5 w-3.5" />
                            {resume.header.portfolio}
                        </span>
                    )}
                </div>
            </header>

            {/* Summary */}
            {resume.summary && (
                <section className="mb-6">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-purple-600 border-b border-purple-200 pb-1 mb-3">
                        Professional Summary
                    </h2>
                    <p
                        className="text-gray-700 leading-relaxed"
                        contentEditable={isEditing}
                        suppressContentEditableWarning
                        onBlur={(e) => handleEdit('summary', e.currentTarget.textContent || '')}
                    >
                        {resume.summary}
                    </p>
                </section>
            )}

            {/* Skills */}
            <section className="mb-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-purple-600 border-b border-purple-200 pb-1 mb-3">
                    Technical Skills
                </h2>
                <div className="space-y-2 text-sm">
                    {resume.skills.languages.length > 0 && (
                        <div>
                            <span className="font-semibold text-gray-700">Languages: </span>
                            <span className="text-gray-600">{resume.skills.languages.join(', ')}</span>
                        </div>
                    )}
                    {resume.skills.frameworks.length > 0 && (
                        <div>
                            <span className="font-semibold text-gray-700">Frameworks: </span>
                            <span className="text-gray-600">{resume.skills.frameworks.join(', ')}</span>
                        </div>
                    )}
                    {resume.skills.databases.length > 0 && (
                        <div>
                            <span className="font-semibold text-gray-700">Databases: </span>
                            <span className="text-gray-600">{resume.skills.databases.join(', ')}</span>
                        </div>
                    )}
                    {resume.skills.tools.length > 0 && (
                        <div>
                            <span className="font-semibold text-gray-700">Tools & Platforms: </span>
                            <span className="text-gray-600">{resume.skills.tools.join(', ')}</span>
                        </div>
                    )}
                    {resume.skills.concepts.length > 0 && (
                        <div>
                            <span className="font-semibold text-gray-700">Concepts: </span>
                            <span className="text-gray-600">{resume.skills.concepts.join(', ')}</span>
                        </div>
                    )}
                </div>
            </section>

            {/* Projects */}
            {resume.projects.length > 0 && (
                <section className="mb-6">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-purple-600 border-b border-purple-200 pb-1 mb-3">
                        Projects
                    </h2>
                    <div className="space-y-4">
                        {resume.projects.map((project, index) => (
                            <div key={project.id || index}>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3
                                            className="font-semibold text-gray-900"
                                            contentEditable={isEditing}
                                            suppressContentEditableWarning
                                            onBlur={(e) => handleEdit(`projects.${index}.name`, e.currentTarget.textContent || '')}
                                        >
                                            {project.name}
                                        </h3>
                                        {project.url && (
                                            <a
                                                href={project.url}
                                                className="text-xs text-purple-600 hover:underline flex items-center gap-1"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {project.url}
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        )}
                                    </div>
                                    {project.technologies.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {project.technologies.slice(0, 4).map((tech, i) => (
                                                <span
                                                    key={i}
                                                    className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700"
                                                >
                                                    {tech}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <p
                                    className="text-sm text-gray-600 mt-1"
                                    contentEditable={isEditing}
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleEdit(`projects.${index}.description`, e.currentTarget.textContent || '')}
                                >
                                    {project.description}
                                </p>
                                {project.bullets.length > 0 && (
                                    <ul className="mt-2 space-y-1 text-sm text-gray-700 list-disc list-inside">
                                        {project.bullets.map((bullet, i) => (
                                            <li
                                                key={i}
                                                contentEditable={isEditing}
                                                suppressContentEditableWarning
                                                onBlur={(e) => handleEdit(`projects.${index}.bullets.${i}`, e.currentTarget.textContent || '')}
                                            >
                                                {bullet}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Experience */}
            {resume.experience.length > 0 && (
                <section className="mb-6">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-purple-600 border-b border-purple-200 pb-1 mb-3">
                        Work Experience
                    </h2>
                    <div className="space-y-4">
                        {resume.experience.map((exp, index) => (
                            <div key={exp.id || index}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3
                                            className="font-semibold text-gray-900"
                                            contentEditable={isEditing}
                                            suppressContentEditableWarning
                                            onBlur={(e) => handleEdit(`experience.${index}.title`, e.currentTarget.textContent || '')}
                                        >
                                            {exp.title}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            <span
                                                contentEditable={isEditing}
                                                suppressContentEditableWarning
                                                onBlur={(e) => handleEdit(`experience.${index}.company`, e.currentTarget.textContent || '')}
                                            >
                                                {exp.company}
                                            </span>
                                            {exp.location && ` • ${exp.location}`}
                                        </p>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                                    </p>
                                </div>
                                {exp.bullets.length > 0 && (
                                    <ul className="mt-2 space-y-1 text-sm text-gray-700 list-disc list-inside">
                                        {exp.bullets.map((bullet, i) => (
                                            <li
                                                key={i}
                                                contentEditable={isEditing}
                                                suppressContentEditableWarning
                                                onBlur={(e) => handleEdit(`experience.${index}.bullets.${i}`, e.currentTarget.textContent || '')}
                                            >
                                                {bullet}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Education */}
            {resume.education.length > 0 && (
                <section>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-purple-600 border-b border-purple-200 pb-1 mb-3">
                        Education
                    </h2>
                    <div className="space-y-3">
                        {resume.education.map((edu, index) => (
                            <div key={edu.id || index} className="flex justify-between">
                                <div>
                                    <h3
                                        className="font-semibold text-gray-900"
                                        contentEditable={isEditing}
                                        suppressContentEditableWarning
                                        onBlur={(e) => handleEdit(`education.${index}.degree`, e.currentTarget.textContent || '')}
                                    >
                                        {edu.degree} in {edu.field}
                                    </h3>
                                    <p className="text-sm text-gray-600">{edu.institution}</p>
                                </div>
                                {edu.graduationDate && (
                                    <p className="text-sm text-gray-500">{edu.graduationDate}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
