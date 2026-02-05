import { NextRequest, NextResponse } from 'next/server';
import { ResumeParser } from '@/lib/llm/resume-parser-fixed';
// @ts-ignore
import pdfParse from 'pdf-parse/lib/pdf-parse';
import mammoth from 'mammoth';

// Helper to convert Buffer to ArrayBuffer
function toArrayBuffer(buffer: Buffer) {
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        let text = '';

        if (file.type === 'application/pdf') {
            const data = await pdfParse(buffer);
            text = data.text;
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth.extractRawText({ buffer });
            text = result.value;
        } else {
            return NextResponse.json({ error: 'Unsupported file type. Please upload PDF or DOCX.' }, { status: 400 });
        }

        if (!text.trim()) {
            return NextResponse.json({ error: 'Could not extract text from file.' }, { status: 400 });
        }

        const parser = new ResumeParser();
        const resume = await parser.parseResume(text);

        return NextResponse.json({
            data: resume
        });

    } catch (error) {
        console.error('Parse API Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to parse resume' },
            { status: 500 }
        );
    }
}
