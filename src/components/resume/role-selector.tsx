/**
 * Role Selector Component
 * 
 * Dropdown/selectable list for choosing target job role
 * for ATS-optimized resume generation
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Briefcase,
    Code,
    Database,
    Brain,
    GraduationCap,
    ChevronDown,
    Check,
    Pencil,
} from 'lucide-react';

export interface JobRole {
    id: string;
    title: string;
    category: string;
    icon: React.ReactNode;
    keywords: string[];
}

export const JOB_ROLES: JobRole[] = [
    // Engineering
    {
        id: 'software-engineer',
        title: 'Software Engineer',
        category: 'Engineering',
        icon: <Code className="h-4 w-4" />,
        keywords: ['software development', 'algorithms', 'data structures', 'system design', 'agile'],
    },
    {
        id: 'frontend-developer',
        title: 'Frontend Developer',
        category: 'Engineering',
        icon: <Code className="h-4 w-4" />,
        keywords: ['React', 'Vue', 'CSS', 'JavaScript', 'responsive design', 'UI/UX', 'accessibility'],
    },
    {
        id: 'backend-developer',
        title: 'Backend Developer',
        category: 'Engineering',
        icon: <Code className="h-4 w-4" />,
        keywords: ['API design', 'databases', 'microservices', 'server-side', 'scalability', 'security'],
    },
    {
        id: 'fullstack-developer',
        title: 'Full Stack Developer',
        category: 'Engineering',
        icon: <Code className="h-4 w-4" />,
        keywords: ['full stack', 'frontend', 'backend', 'databases', 'deployment', 'cloud'],
    },
    {
        id: 'devops-engineer',
        title: 'DevOps Engineer',
        category: 'Engineering',
        icon: <Code className="h-4 w-4" />,
        keywords: ['CI/CD', 'Docker', 'Kubernetes', 'AWS', 'automation', 'infrastructure', 'monitoring'],
    },
    {
        id: 'mobile-developer',
        title: 'Mobile Developer',
        category: 'Engineering',
        icon: <Code className="h-4 w-4" />,
        keywords: ['iOS', 'Android', 'React Native', 'Flutter', 'mobile development', 'app store'],
    },

    // Data
    {
        id: 'data-scientist',
        title: 'Data Scientist',
        category: 'Data',
        icon: <Database className="h-4 w-4" />,
        keywords: ['machine learning', 'statistics', 'Python', 'data analysis', 'visualization', 'modeling'],
    },
    {
        id: 'data-analyst',
        title: 'Data Analyst',
        category: 'Data',
        icon: <Database className="h-4 w-4" />,
        keywords: ['SQL', 'Excel', 'data visualization', 'reporting', 'business intelligence', 'analytics'],
    },
    {
        id: 'ml-engineer',
        title: 'Machine Learning Engineer',
        category: 'Data',
        icon: <Brain className="h-4 w-4" />,
        keywords: ['deep learning', 'TensorFlow', 'PyTorch', 'model deployment', 'MLOps', 'neural networks'],
    },
    {
        id: 'ai-researcher',
        title: 'AI Researcher',
        category: 'Data',
        icon: <Brain className="h-4 w-4" />,
        keywords: ['research', 'publications', 'NLP', 'computer vision', 'reinforcement learning', 'PhD'],
    },

    // Academic
    {
        id: 'phd-application',
        title: 'PhD Application',
        category: 'Academic',
        icon: <GraduationCap className="h-4 w-4" />,
        keywords: ['research', 'publications', 'thesis', 'academic', 'teaching assistant', 'grants'],
    },
    {
        id: 'research-fellowship',
        title: 'Research Fellowship',
        category: 'Academic',
        icon: <GraduationCap className="h-4 w-4" />,
        keywords: ['research experience', 'publications', 'grants', 'collaboration', 'presentations'],
    },
    {
        id: 'scholarship',
        title: 'Scholarship Application',
        category: 'Academic',
        icon: <GraduationCap className="h-4 w-4" />,
        keywords: ['academic excellence', 'leadership', 'community service', 'extracurricular', 'achievements'],
    },

    // Business
    {
        id: 'technical-pm',
        title: 'Technical Product Manager',
        category: 'Business',
        icon: <Briefcase className="h-4 w-4" />,
        keywords: ['product strategy', 'roadmap', 'stakeholder management', 'agile', 'technical leadership'],
    },
    {
        id: 'engineering-manager',
        title: 'Engineering Manager',
        category: 'Business',
        icon: <Briefcase className="h-4 w-4" />,
        keywords: ['team leadership', 'mentoring', 'project management', 'agile', 'technical vision'],
    },
];

interface RoleSelectorProps {
    selectedRole: JobRole | null;
    customRole: string;
    onRoleSelect: (role: JobRole | null) => void;
    onCustomRoleChange: (role: string) => void;
}

export function RoleSelector({
    selectedRole,
    customRole,
    onRoleSelect,
    onCustomRoleChange,
}: RoleSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isCustom, setIsCustom] = useState(false);

    const categories = [...new Set(JOB_ROLES.map(r => r.category))];

    const handleRoleClick = (role: JobRole) => {
        onRoleSelect(role);
        setIsCustom(false);
        setIsOpen(false);
    };

    const handleCustomClick = () => {
        setIsCustom(true);
        onRoleSelect(null);
        setIsOpen(false);
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Briefcase className="h-5 w-5" />
                    Target Job Role
                </CardTitle>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    Select a role to optimize your resume for ATS systems
                </p>
            </CardHeader>
            <CardContent>
                {/* Selected Role Display */}
                <div
                    className="p-3 border rounded-lg cursor-pointer hover:border-[hsl(var(--primary))] transition-colors"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {selectedRole ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {selectedRole.icon}
                                <div>
                                    <span className="font-medium">{selectedRole.title}</span>
                                    <Badge variant="secondary" className="ml-2 text-xs">
                                        {selectedRole.category}
                                    </Badge>
                                </div>
                            </div>
                            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </div>
                    ) : isCustom ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Pencil className="h-4 w-4" />
                                <span className="font-medium">{customRole || 'Enter custom role...'}</span>
                            </div>
                            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </div>
                    ) : (
                        <div className="flex items-center justify-between text-[hsl(var(--muted-foreground))]">
                            <span>Select a target role...</span>
                            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </div>
                    )}
                </div>

                {/* Custom Role Input */}
                {isCustom && (
                    <div className="mt-3">
                        <input
                            type="text"
                            value={customRole}
                            onChange={(e) => onCustomRoleChange(e.target.value)}
                            placeholder="e.g., Cloud Solutions Architect"
                            className="w-full p-3 border rounded-lg bg-transparent focus:outline-none focus:border-[hsl(var(--primary))]"
                        />
                    </div>
                )}

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="mt-3 border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                        {categories.map(category => (
                            <div key={category}>
                                <div className="px-3 py-2 bg-[hsl(var(--muted))] text-sm font-semibold text-[hsl(var(--muted-foreground))]">
                                    {category}
                                </div>
                                {JOB_ROLES.filter(r => r.category === category).map(role => (
                                    <div
                                        key={role.id}
                                        onClick={() => handleRoleClick(role)}
                                        className={`
                                            flex items-center gap-3 p-3 cursor-pointer hover:bg-[hsl(var(--muted))] transition-colors
                                            ${selectedRole?.id === role.id ? 'bg-[hsl(var(--primary))]/10' : ''}
                                        `}
                                    >
                                        {role.icon}
                                        <span className="flex-1">{role.title}</span>
                                        {selectedRole?.id === role.id && (
                                            <Check className="h-4 w-4 text-[hsl(var(--primary))]" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}

                        {/* Custom Option */}
                        <div className="border-t">
                            <div
                                onClick={handleCustomClick}
                                className={`
                                    flex items-center gap-3 p-3 cursor-pointer hover:bg-[hsl(var(--muted))] transition-colors
                                    ${isCustom ? 'bg-[hsl(var(--primary))]/10' : ''}
                                `}
                            >
                                <Pencil className="h-4 w-4" />
                                <span className="flex-1">Other (Custom Role)</span>
                                {isCustom && (
                                    <Check className="h-4 w-4 text-[hsl(var(--primary))]" />
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Keywords Preview */}
                {selectedRole && (
                    <div className="mt-4">
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">
                            Your resume will be optimized for these keywords:
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {selectedRole.keywords.map((keyword, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                    {keyword}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default RoleSelector;
