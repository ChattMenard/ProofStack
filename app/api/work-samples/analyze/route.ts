/**
 * SECURITY HARDENED Work Sample Analysis API
 * Integrates: Rate limiting, secret detection, audit logging, input validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { withRateLimit } from '@/lib/security/rateLimiting';
import { validateWorkSampleSecurity, detectSecrets } from '@/lib/security/secretDetection';

// Force this route to use Node.js runtime (not Edge)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Rate limiting (AI analysis is expensive)
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
    };
    
    const rateLimitResponse = await withRateLimit(request, 'aiAnalysis', getUserId);
    if (rateLimitResponse) {
      return rateLimitResponse; // Rate limit exceeded
    }

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { work_sample_id } = await request.json();

    if (!work_sample_id) {
      return NextResponse.json(
        { error: 'work_sample_id is required' },
        { status: 400 }
      );
    }

    // Fetch work sample with RLS
    const { data: sample, error: fetchError } = await supabase
      .from('work_samples')
      .select('*')
      .eq('id', work_sample_id)
      .single();

    if (fetchError || !sample) {
      // SECURITY: Log failed access attempt
      await logSecurityEvent(user.id, 'work_sample_analysis_failed', work_sample_id, false, {
        reason: 'sample_not_found_or_unauthorized',
        error: fetchError?.message,
      });
      
      return NextResponse.json(
        { error: 'Work sample not found or access denied' },
        { status: 404 }
      );
    }

    // SECURITY: Verify user has permission to trigger analysis
    if (user.id !== sample.employer_id && user.id !== sample.professional_id) {
      await logSecurityEvent(user.id, 'work_sample_analysis_unauthorized', work_sample_id, false, {
        reason: 'not_employer_or_professional',
      });
      
      return NextResponse.json(
        { error: 'Unauthorized: Only employer or professional can request analysis' },
        { status: 403 }
      );
    }

    // SECURITY: Check if already analyzed (prevent repeated analysis costs)
    if (sample.ai_analyzed) {
      return NextResponse.json(
        { 
          error: 'Sample already analyzed',
          analysis: {
            overall_quality_score: sample.overall_quality_score,
            ai_feedback: sample.ai_feedback,
          }
        },
        { status: 400 }
      );
    }

    // SECURITY: Validate content before sending to OpenAI
    const securityValidation = await validateWorkSampleSecurity(sample.content);
    
    if (!securityValidation.safe) {
      // Log security validation failure
      await logSecurityEvent(user.id, 'work_sample_security_validation_failed', work_sample_id, false, {
        errors: securityValidation.errors,
        warnings: securityValidation.warnings,
      });
      
      return NextResponse.json(
        {
          error: 'Content failed security validation',
          details: securityValidation.errors,
          warnings: securityValidation.warnings,
        },
        { status: 400 }
      );
    }

    // SECURITY: Warn about PII/secrets even if not critical
    if (securityValidation.warnings.length > 0) {
      // Log warnings but continue
      await logSecurityEvent(user.id, 'work_sample_security_warnings', work_sample_id, true, {
        warnings: securityValidation.warnings,
      });
    }

    // Determine analysis type
    const isCodeSample = ['code', 'technical_spec'].includes(sample.content_type);

    // Build AI prompt
    const prompt = isCodeSample
      ? buildCodeAnalysisPrompt(sample.content, sample.language, sample.content_type)
      : buildWritingAnalysisPrompt(sample.content, sample.content_type);

    // SECURITY: Log before sending to OpenAI (track third-party exposure)
    await logSecurityEvent(user.id, 'work_sample_sent_to_openai', work_sample_id, true, {
      content_type: sample.content_type,
      content_length: sample.content.length,
      confidentiality_level: sample.confidentiality_level,
      has_warnings: securityValidation.warnings.length > 0,
    });

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert technical reviewer analyzing work samples for quality assessment.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // Parse AI response
    const analysis = parseAIResponse(aiResponse, isCodeSample);

    // Update work sample with scores
    const { error: updateError } = await supabase
      .from('work_samples')
      .update({
        ai_analyzed: true,
        ai_analysis_date: new Date().toISOString(),
        ...(isCodeSample ? {
          code_quality_score: analysis.code_quality_score,
          technical_depth_score: analysis.technical_depth_score,
          problem_solving_score: analysis.problem_solving_score,
          documentation_quality_score: analysis.documentation_quality_score,
          best_practices_score: analysis.best_practices_score,
        } : {
          writing_clarity_score: analysis.writing_clarity_score,
          technical_accuracy_score: analysis.technical_accuracy_score,
        }),
        overall_quality_score: analysis.overall_quality_score,
        ai_feedback: analysis.feedback,
      })
      .eq('id', work_sample_id);

    if (updateError) {
      throw updateError;
    }

    // SECURITY: Log successful analysis
    await logSecurityEvent(user.id, 'work_sample_analysis_completed', work_sample_id, true, {
      overall_score: analysis.overall_quality_score,
      content_type: sample.content_type,
    });

    // Trigger ProofScore recalculation (existing logic)
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/proofscore/recalculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ professional_id: sample.professional_id }),
    });

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error('Work sample analysis error:', error);
    
    // SECURITY: Log error
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await logSecurityEvent(user.id, 'work_sample_analysis_error', null, false, {
          error: error.message,
        });
      }
    } catch (logError) {
      // Ignore logging errors
    }
    
    return NextResponse.json(
      { error: 'Analysis failed', details: error.message },
      { status: 500 }
    );
  }
}

// Helper: Log security events to audit table
async function logSecurityEvent(
  userId: string,
  action: string,
  resourceId: string | null,
  success: boolean,
  metadata: Record<string, any>
) {
  try {
    await supabase.from('security_audit_log').insert({
      user_id: userId,
      action,
      resource_type: 'work_sample',
      resource_id: resourceId,
      success,
      metadata,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
    // Don't throw - logging failures shouldn't break the main flow
  }
}

// Helper: Build code analysis prompt
function buildCodeAnalysisPrompt(content: string, language: string | null, type: string): string {
  return `Analyze this ${language || 'code'} sample and rate it on a scale of 0-10 for each criterion.

SAMPLE TYPE: ${type}
LANGUAGE: ${language || 'unknown'}

CODE:
\`\`\`
${content}
\`\`\`

Rate the following (0-10 scale):
1. Code Quality: Clean, readable, maintainable
2. Technical Depth: Complexity and sophistication
3. Problem Solving: Effectiveness of solution
4. Documentation: Comments and clarity
5. Best Practices: Industry standards adherence

Provide scores in this exact format:
CODE_QUALITY: [score]
TECHNICAL_DEPTH: [score]
PROBLEM_SOLVING: [score]
DOCUMENTATION: [score]
BEST_PRACTICES: [score]
OVERALL: [average of above]

Then provide 2-3 sentences of constructive feedback.`;
}

// Helper: Build writing analysis prompt
function buildWritingAnalysisPrompt(content: string, type: string): string {
  return `Analyze this ${type} sample and rate it on a scale of 0-10 for each criterion.

CONTENT:
${content}

Rate the following (0-10 scale):
1. Clarity: Clear, concise communication
2. Technical Accuracy: Correctness of information
3. Professionalism: Appropriate tone and style
4. Completeness: Thoroughness of coverage

Provide scores in this exact format:
CLARITY: [score]
TECHNICAL_ACCURACY: [score]
PROFESSIONALISM: [score]
COMPLETENESS: [score]
OVERALL: [average of above]

Then provide 2-3 sentences of constructive feedback.`;
}

// Helper: Parse AI response
function parseAIResponse(response: string, isCode: boolean): any {
  const lines = response.split('\n');
  const scores: Record<string, number> = {};
  let feedback = '';
  let parsingFeedback = false;

  for (const line of lines) {
    if (line.includes(':')) {
      const [key, value] = line.split(':');
      const score = parseFloat(value.trim());
      if (!isNaN(score)) {
        scores[key.trim().toLowerCase().replace(/\s+/g, '_')] = score;
      }
    } else if (line.trim() && parsingFeedback) {
      feedback += line + '\n';
    } else if (scores.overall !== undefined && line.trim()) {
      parsingFeedback = true;
      feedback = line + '\n';
    }
  }

  return {
    ...scores,
    feedback: { summary: feedback.trim() },
  };
}
