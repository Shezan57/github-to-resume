"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Loader2, File, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUsage } from "@/contexts/usage-context"; // Import Usage Context

export function UploadResume() {
    const router = useRouter();
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { incrementGeneration, hasReachedGenerationLimit, setShowRegistrationWall } = useUsage();

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        // Check limits before starting upload
        if (hasReachedGenerationLimit) {
            setShowRegistrationWall(true);
            return;
        }

        setIsUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/api/parse-resume", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to parse resume");
            }

            // Increment generation usage on successful parse
            incrementGeneration();

            // Store resume in localStorage to be picked up by editor
            localStorage.setItem("generated_resume", JSON.stringify(data.data));

            // Redirect to resume editor
            if (data.data.id) { // Ensure ID exists
                router.push(`/resume/${data.data.id}`);
            } else {
                // Fallback if ID generation happens differently, maybe utilize username if present
                router.push(`/resume/${data.data.username || 'uploaded-resume'}`);
            }

        } catch (err) {
            console.error("Upload error:", err);
            setError(err instanceof Error ? err.message : "Failed to upload and parse resume");
        } finally {
            setIsUploading(false);
        }
    }, [router, hasReachedGenerationLimit, incrementGeneration, setShowRegistrationWall]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "application/pdf": [".pdf"],
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
        },
        maxFiles: 1,
        multiple: false,
    });

    return (
        <Card className="w-full max-w-xl mx-auto border-dashed border-2 bg-muted/50 hover:bg-muted/80 transition-colors">
            <CardContent className="p-0">
                <div
                    {...getRootProps()}
                    className={`
                        flex flex-col items-center justify-center p-8 cursor-pointer min-h-[200px] text-center
                        ${isDragActive ? "bg-primary/5" : ""}
                        ${isUploading ? "pointer-events-none opacity-50" : ""}
                    `}
                >
                    <input {...getInputProps()} />

                    {isUploading ? (
                        <>
                            <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                            <h3 className="text-lg font-semibold">Analyzing your resume...</h3>
                            <p className="text-sm text-muted-foreground mt-2">
                                Extracting skills, experience, and achievements with AI
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <Upload className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold mb-1">
                                Upload your existing resume
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                                Drag & drop PDF or DOCX here, or click to select
                            </p>
                            <div className="flex gap-2">
                                <Badge variant="secondary" className="font-normal text-xs">
                                    <File className="h-3 w-3 mr-1" /> PDF
                                </Badge>
                                <Badge variant="secondary" className="font-normal text-xs">
                                    <FileText className="h-3 w-3 mr-1" /> DOCX
                                </Badge>
                            </div>
                        </>
                    )}

                    {error && (
                        <div className="mt-4 flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-2 rounded">
                            <AlertCircle className="h-4 w-4" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

import { Badge } from "@/components/ui/badge";
