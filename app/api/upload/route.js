import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import pdfParse from 'pdf-parse';

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
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // 1. File Validation
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Verify magic bytes (25 50 44 46) for PDF
    // PDF files start with %PDF- which in hex is 25 50 44 46
    if (buffer.length < 4 || buffer[0] !== 0x25 || buffer[1] !== 0x50 || buffer[2] !== 0x44 || buffer[3] !== 0x46) {
      return NextResponse.json(
        { success: false, error: 'Invalid PDF file format' },
        { status: 400 }
      );
    }

    // 2. Extract Text
    let extractedText = '';
    try {
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text;
    } catch (error) {
      console.error('PDF parsing error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to extract text from PDF' },
        { status: 400 }
      );
    }

    // 3. Supabase Operations
    const id = crypto.randomUUID();
    const timestamp = Date.now();
    const filename = `${timestamp}-${id}.pdf`;
    
    // Upload to storage bucket (private 'resumes' bucket)
    const { data: storageData, error: storageError } = await supabase
      .storage
      .from('resumes')
      .upload(filename, buffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (storageError) {
      console.error('Storage upload error:', storageError);
      return NextResponse.json(
        { success: false, error: 'Failed to upload file to storage' },
        { status: 500 }
      );
    }

    // Save metadata to database
    // Assuming 'quickapply.resumes' means the table is called 'resumes'
    const { error: dbError } = await supabase
      .from('resumes')
      .insert({
        id: id,
        original_name: file.name,
        storage_path: filename,
        mime_type: 'application/pdf',
        size_bytes: file.size,
        created_at: new Date().toISOString(),
        extracted_text: extractedText,
        skills: null,
        analysis: null
      });

    if (dbError) {
      console.error('Database insert error:', dbError);
      
      // Attempt cleanup of storage if DB insert fails
      await supabase.storage.from('resumes').remove([filename]);
      
      return NextResponse.json(
        { success: false, error: 'Failed to save resume metadata' },
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
      { success: false, error: 'An unexpected error occurred during upload' },
      { status: 500 }
    );
  }
}
