import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import PDFParser from 'pdf2json';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request) {
  try {
    // 1. Initialize Supabase locally in the handler to prevent global 500 crashes
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error: Missing environment variables' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // 2. File Validation
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
    const headerString = buffer.toString('utf8', 0, Math.min(buffer.length, 1024));
    if (!headerString.includes('%PDF-')) {
      return NextResponse.json(
        { success: false, error: 'Invalid PDF file format' },
        { status: 400 }
      );
    }

    // 3. Extract Text using pdf2json
    let extractedText = '';
    try {
      extractedText = await new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, 1);
        
        pdfParser.on("pdfParser_dataError", errData => {
          reject(errData.parserError);
        });
        
        pdfParser.on("pdfParser_dataReady", () => {
          resolve(pdfParser.getRawTextContent());
        });
        
        pdfParser.parseBuffer(buffer);
      });
    } catch (error) {
      console.error('PDF parsing error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to extract text from PDF. Please ensure the file is not corrupted.' },
        { status: 400 }
      );
    }

    // Sanitize extracted text to remove null bytes and invalid control characters
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
