import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PDFParse } from 'pdf-parse';

// Initialize Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request) {
  try {
    // Content-Type check skipped for upload — expects multipart/form-data

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // 1. File Validation
    const isPdfType = file.type === 'application/pdf';
    const isPdfExt = file.name.toLowerCase().endsWith('.pdf');
    if (!isPdfType || !isPdfExt) {
      return NextResponse.json(
        { success: false, error: 'Only PDF files are allowed.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size must be under 5MB.' },
        { status: 400 }
      );
    }

    let sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
    if (sanitizedOriginalName.length > 100) {
      sanitizedOriginalName = sanitizedOriginalName.substring(0, 100);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Verify magic bytes (%PDF-) for PDF
    // PDF files start with %PDF- (hex 25 50 44 46 2D) but can have up to 1024 bytes before the header
    const headerString = buffer.toString('utf8', 0, Math.min(buffer.length, 1024));
    if (!headerString.includes('%PDF-')) {
      return NextResponse.json(
        { success: false, error: 'Invalid PDF file format' },
        { status: 400 }
      );
    }

    // 2. Extract Text (pdf-parse v2 API)
    let extractedText = '';
    let parser = null;
    try {
      const uint8Array = new Uint8Array(arrayBuffer);
      parser = new PDFParse({ data: uint8Array });
      const result = await parser.getText();
      extractedText = result.text;
    } catch (error) {
      console.error('PDF parsing error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to extract text from PDF. Please ensure the file is not corrupted.' },
        { status: 400 }
      );
    } finally {
      if (parser) {
        await parser.destroy().catch(() => {});
      }
    }

    // Sanitize extracted text to remove null bytes and invalid control characters
    // Postgres text/jsonb columns cannot store \u0000 or certain control sequences
    const sanitizedText = extractedText
      .replace(/\u0000/g, '')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

    // 3. Supabase Operations
    const id = crypto.randomUUID();
    const timestamp = Date.now();
    const filename = `${timestamp}-${id}.pdf`;
    
    // Upload to storage bucket (private 'resumes' bucket)
    const { data: storageData, error: storageError } = await supabase
      .storage
      .from('resumes')
      .upload(filename, file, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (storageError) {
      console.error('Storage upload error:', storageError);
      return NextResponse.json(
        { success: false, error: 'Failed to upload file. Please try again.' },
        { status: 500 }
      );
    }

    // Save metadata to database
    const { error: dbError } = await supabase
      .from('resumes')
      .insert({
        id: id,
        original_name: sanitizedOriginalName,
        storage_path: filename,
        mime_type: 'application/pdf',
        size_bytes: file.size,
        created_at: new Date().toISOString(),
        extracted_text: sanitizedText,
        skills: null,
        analysis: null
      });

    if (dbError) {
      console.error('Database insert error:', dbError);
      
      // Attempt cleanup of storage if DB insert fails
      await supabase.storage.from('resumes').remove([filename]);
      
      return NextResponse.json(
        { success: false, error: "Failed to process this file. Please make sure it's a valid PDF resume." },
        { status: 500 }
      );
    }

    // 4. Return Success Response
    return NextResponse.json(
      {
        success: true,
        resumeId: id,
        message: 'Resume uploaded successfully'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Upload handler error:', error);
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
