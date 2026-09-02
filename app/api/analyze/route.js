import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

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

// Initialize Gemini client
const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
let ai;
if (geminiApiKey) {
  ai = new GoogleGenAI({ apiKey: geminiApiKey });
}

// Minimum extracted text length to bother calling Gemini
const MIN_TEXT_LENGTH = 50;

// Models to try in order — each has its own separate quota pool
const MODELS = [
  'gemini-3.6-flash',
  'gemini-3.6-pro',
  'gemini-3.6-flash-lite',
];

const MAX_RETRIES = 2;

// Helper: sleep for ms
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper: check if error is a 429 rate-limit error
function isRateLimitError(error) {
  const msg = (error?.message || '').toLowerCase();
  return msg.includes('429') || msg.includes('resource_exhausted') || msg.includes('quota');
}

// Helper: check if error is an auth/model not found error
function isAuthError(error) {
  const msg = (error?.message || '').toLowerCase();
  return msg.includes('404') || msg.includes('not found') || msg.includes('400') || msg.includes('403') || msg.includes('401') || msg.includes('api key');
}

// Helper: extract retry delay from error message (e.g. "Please retry in 19.3s")
function getRetryDelay(error) {
  const match = (error?.message || '').match(/retry in ([\d.]+)s/i);
  if (match) return Math.ceil(parseFloat(match[1]) * 1000);
  return null;
}

// Try calling Gemini with retries + model fallback
async function callGeminiWithFallback(aiClient, prompt) {
  let lastError = null;

  for (const model of MODELS) {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await aiClient.models.generateContent({
          model,
          contents: prompt,
          config: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          }
        });

        const rawText = typeof response.text === 'function' ? response.text() : response.text;

        console.log(`Raw Gemini Response (First 500 chars): ${rawText.substring(0, 500)}`);

        let parsedResult;
        // Try parsing JSON directly
        try {
          parsedResult = JSON.parse(rawText);
        } catch (_parseErr) {
          // Fallback 1: extract from markdown code block
          const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch) {
            try {
              parsedResult = JSON.parse(jsonMatch[1].trim());
            } catch (e2) {}
          }
          
          // Fallback 2: find first { and last }
          if (!parsedResult) {
            const firstBrace = rawText.indexOf('{');
            const lastBrace = rawText.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
              try {
                parsedResult = JSON.parse(rawText.substring(firstBrace, lastBrace + 1));
              } catch (e3) {}
            }
          }
          
          if (!parsedResult) {
            throw new Error('Malformed JSON from Gemini');
          }
        }
        
        return parsedResult;
      } catch (err) {
        lastError = err;

        if (isRateLimitError(err)) {
          // If this is the last retry for this model, break to try next model
          if (attempt === MAX_RETRIES) {
            console.log(`Rate-limited on ${model} after ${attempt + 1} attempts, trying next model...`);
            break;
          }

          // Wait before retrying — use the delay from the error or exponential backoff
          const delay = getRetryDelay(err) || (Math.pow(2, attempt) * 2000);
          
          if (delay > 5000) {
            console.log(`Rate-limit delay on ${model} is too long (${delay}ms), skipping to next model...`);
            break; // Skip to next model instead of waiting
          }

          console.log(`Rate-limited on ${model}, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`);
          await sleep(delay);
          continue;
        }

        // If it's a model not found or forbidden error, try the next model
        const msg = (err?.message || '').toLowerCase();
        if (msg.includes('404') || msg.includes('not found') || msg.includes('403') || msg.includes('forbidden')) {
          console.log(`Model ${model} unavailable (404/403), trying next model...`);
          break; // break the attempt loop to move to the next model
        }

        // Non-rate-limit error and not a model availability error — don't retry, propagate
        throw err;
      }
    }
  }

  // All models exhausted
  throw lastError || new Error('All Gemini models quota-exhausted');
}

export async function POST(request) {
  try {
    const body = await request.json();
    const resumeId = body.resumeId;

    if (!resumeId) {
      return NextResponse.json(
        { success: false, error: 'No resume ID provided' },
        { status: 400 }
      );
    }

    if (!ai) {
      return NextResponse.json(
        { success: false, error: 'Gemini API key is not configured' },
        { status: 500 }
      );
    }

    // 1. Fetch resume from Supabase
    const { data: resume, error: fetchError } = await supabase
      .from('resumes')
      .select('extracted_text')
      .eq('id', resumeId)
      .single();

    if (fetchError || !resume) {
      return NextResponse.json(
        { success: false, error: 'Resume not found' },
        { status: 404 }
      );
    }

    const text = (resume.extracted_text || '').trim();

    // 2. Short/empty text — skip Gemini, return invalid
    if (text.length < MIN_TEXT_LENGTH) {
      return NextResponse.json({
        success: true,
        isValidResume: false,
        reason: 'The uploaded document contains too little text to be a valid resume.'
      });
    }

    // 3. Call Gemini AI for validation + analysis
    console.log(`Extracted Text (First 200 chars): ${text.substring(0, 200)}`);

    const prompt = `You are an expert AI resume/CV reviewer. You will receive the full text extracted from a PDF document.

Your job has TWO phases:

PHASE 1 — DOCUMENT VALIDATION
Determine whether this text is actually a resume or CV. Be LENIENT. If the document contains ANY of these: name, email, phone, work experience, education, skills, or job titles — it IS a resume.
Only mark isValidResume: false if the document is CLEARLY not a resume (e.g., purely an invoice, legal contract, image-only PDF, or completely random text with no personal/professional info). When in doubt, assume it IS a resume.

PHASE 2 — RESUME ANALYSIS (only if Phase 1 determines it IS a resume)
If it IS a valid resume, perform a thorough quality and ATS-friendliness analysis.

Return a JSON object with this EXACT schema:

If the document is NOT a valid resume:
{
  "isValidResume": false,
  "reason": "<short human-readable reason, e.g. 'This appears to be an invoice, not a resume'>"
}

If the document IS a valid resume, return:
{
  "isValidResume": true,
  "score": <number 0-100, overall resume quality/ATS-friendliness>,
  "rating": "<one of: 'Needs Improvement', 'Good', 'Great', 'Excellent'>",
  "name": "<candidate full name or 'Unknown'>",
  "role": "<candidate's primary job title or target role>",
  "totalSections": <number of standard resume sections detected>,
  "completedSections": <number of sections that are well-filled>,
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": [
    {
      "id": 1,
      "section": "<section name>",
      "priority": "<high|medium|low>",
      "issue": "<brief issue description>",
      "fix": "<concrete actionable suggestion>"
    }
  ],
  "extractedSkills": ["<skill1>", "<skill2>", "...up to 15 skills"],
  "education": "<brief summary of highest education>",
  "experience": "<e.g. '5 Years', 'Entry Level', 'Senior Level'>",
  "missingSections": ["<e.g. 'Professional Summary'>", "<e.g. 'Certifications'>"]
}

Scoring guidelines:
- 0-30: Major issues, barely usable as a resume
- 31-50: Needs significant improvement
- 51-70: Good foundation but has notable gaps
- 71-85: Strong resume with minor improvements needed
- 86-100: Excellent, highly ATS-optimized resume

Be honest and constructive. Provide at least 3 strengths and 3-5 improvements for valid resumes.

Here is the extracted document text:
---
${text}
---`;

    let aiResult;
    try {
      aiResult = await callGeminiWithFallback(ai, prompt);
    } catch (geminiError) {
      const isQuota = isRateLimitError(geminiError);
      const isAuth = isAuthError(geminiError);
      console.error('Gemini API call failed:', geminiError.message || 'Unknown error');
      
      let errorMessage = 'AI analysis failed, please try again';
      let statusCode = 500;
      
      if (isQuota) {
        errorMessage = 'AI quota exceeded — please wait a minute and try again';
        statusCode = 429;
      } else if (isAuth) {
        errorMessage = 'Invalid Gemini API key or lack of model permissions. Please check your .env.local file.';
        statusCode = 401; // Return 401 so the frontend knows it's an auth error
      }
      
      return NextResponse.json(
        {
          success: false,
          error: errorMessage
        },
        { status: statusCode }
      );
    }

    // 4. Handle the result based on validation
    console.log(`Parsed Result isValidResume: ${aiResult.isValidResume}`);
    
    if (!aiResult.isValidResume) {
      console.log(`Analysis complete for resumeId: ${resumeId} — not a valid resume`);
      return NextResponse.json({
        success: true,
        isValidResume: false,
        reason: aiResult.reason || 'This document does not appear to be a resume.'
      });
    }

    // 5. Valid resume — save analysis to Supabase
    const { error: updateError } = await supabase
      .from('resumes')
      .update({
        analysis: aiResult,
        skills: aiResult.extractedSkills || []
      })
      .eq('id', resumeId);

    if (updateError) {
      console.error('Failed to save analysis for resumeId:', resumeId);
      // Still return the analysis even if DB update fails — client can cache it
    }

    console.log(`Analysis complete for resumeId: ${resumeId} — score: ${aiResult.score}`);

    return NextResponse.json({
      success: true,
      isValidResume: true,
      analysis: aiResult
    });

  } catch (error) {
    console.error('Analyze handler error:', error.message || 'Unknown error');
    return NextResponse.json(
      { success: false, error: 'AI analysis failed, please try again' },
      { status: 500 }
    );
  }
}
