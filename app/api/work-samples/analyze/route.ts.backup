import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { work_sample_id } = await request.json();

    if (!work_sample_id) {
      return NextResponse.json(
        { error: 'work_sample_id is required' },
        { status: 400 }
      );
    }

    // Fetch work sample
    const { data: sample, error: fetchError } = await supabase
      .from('work_samples')
      .select('*')
      .eq('id', work_sample_id)
      .single();

    if (fetchError || !sample) {
      return NextResponse.json(
        { error: 'Work sample not found' },
        { status: 404 }
      );
    }

    // Determine analysis type based on content_type
    const isCodeSample = ['code', 'technical_spec'].includes(sample.content_type);

    // Build AI prompt based on content type
    const prompt = isCodeSample
      ? buildCodeAnalysisPrompt(sample.content, sample.language, sample.content_type)
      : buildWritingAnalysisPrompt(sample.content, sample.content_type);

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert code reviewer and technical writing analyst. Provide detailed, objective quality assessments.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const responseText = completion.choices[0].message.content || '{}';
    
    // Parse JSON response
    let analysis;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse AI analysis' },
        { status: 500 }
      );
    }

    // Calculate overall quality score
    let overallScore = 0;
    let scoreCount = 0;

    if (isCodeSample) {
      const codeScores = [
        analysis.code_quality,
        analysis.technical_depth,
        analysis.problem_solving,
        analysis.documentation_quality,
        analysis.best_practices
      ].filter(s => typeof s === 'number');
      
      overallScore = codeScores.reduce((sum, s) => sum + s, 0) / codeScores.length;
      
      // Update work sample with code scores
      const { error: updateError } = await supabase
        .from('work_samples')
        .update({
          code_quality_score: analysis.code_quality || 0,
          technical_depth_score: analysis.technical_depth || 0,
          problem_solving_score: analysis.problem_solving || 0,
          documentation_quality_score: analysis.documentation_quality || 0,
          best_practices_score: analysis.best_practices || 0,
          overall_quality_score: overallScore,
          ai_analyzed: true,
          ai_analysis_date: new Date().toISOString(),
          ai_feedback: {
            strengths: analysis.strengths || [],
            improvements: analysis.improvements || [],
            overall_assessment: analysis.overall_assessment || '',
            technical_highlights: analysis.technical_highlights || []
          }
        })
        .eq('id', work_sample_id);

      if (updateError) throw updateError;
    } else {
      // Writing/documentation sample
      const writingScores = [
        analysis.clarity,
        analysis.technical_accuracy,
        analysis.professionalism,
        analysis.completeness
      ].filter(s => typeof s === 'number');
      
      overallScore = writingScores.reduce((sum, s) => sum + s, 0) / writingScores.length;
      
      // Update work sample with writing scores
      const { error: updateError } = await supabase
        .from('work_samples')
        .update({
          writing_clarity_score: analysis.clarity || 0,
          technical_accuracy_score: analysis.technical_accuracy || 0,
          overall_quality_score: overallScore,
          ai_analyzed: true,
          ai_analysis_date: new Date().toISOString(),
          ai_feedback: {
            strengths: analysis.strengths || [],
            improvements: analysis.improvements || [],
            overall_assessment: analysis.overall_assessment || ''
          }
        })
        .eq('id', work_sample_id);

      if (updateError) throw updateError;
    }

    // Trigger ProofScore V2 recalculation
    // The overall_quality_score feeds into task_correctness_rating
    const { error: proofScoreError } = await supabase.rpc(
      'update_professional_proof_score_v2',
      { p_professional_id: sample.professional_id }
    );

    if (proofScoreError) {
      console.error('ProofScore update error:', proofScoreError);
    }

    return NextResponse.json({
      success: true,
      overall_quality_score: overallScore,
      analysis: analysis,
      message: 'Work sample analyzed successfully'
    });

  } catch (error: any) {
    console.error('Error analyzing work sample:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

function buildCodeAnalysisPrompt(content: string, language: string | null, contentType: string): string {
  return `Analyze this ${language || 'code'} sample (${contentType}) and provide a detailed quality assessment.

CODE SAMPLE:
\`\`\`${language || ''}
${content}
\`\`\`

Evaluate on these criteria (0-10 scale):

1. **Code Quality** - Clean code, readability, naming conventions, structure
2. **Technical Depth** - Complexity handled, algorithms used, architecture decisions
3. **Problem Solving** - Logic correctness, edge cases, efficiency
4. **Documentation Quality** - Comments, clarity, explaining why not just what
5. **Best Practices** - Industry standards, patterns, error handling, security

Return ONLY valid JSON:
{
  "code_quality": 8.5,
  "technical_depth": 7.0,
  "problem_solving": 9.0,
  "documentation_quality": 6.5,
  "best_practices": 8.0,
  "strengths": ["Clear naming", "Good error handling", "Efficient algorithm"],
  "improvements": ["Could add more comments", "Consider edge case X"],
  "technical_highlights": ["Uses memoization", "Handles async properly"],
  "overall_assessment": "High-quality implementation with solid fundamentals. Shows understanding of ${language || 'programming'} best practices."
}`;
}

function buildWritingAnalysisPrompt(content: string, contentType: string): string {
  return `Analyze this technical ${contentType} sample and provide a detailed quality assessment.

CONTENT:
${content}

Evaluate on these criteria (0-10 scale):

1. **Clarity** - Easy to understand, well-organized, logical flow
2. **Technical Accuracy** - Correct information, precise terminology
3. **Professionalism** - Appropriate tone, grammar, spelling
4. **Completeness** - Covers topic thoroughly, includes necessary details

Return ONLY valid JSON:
{
  "clarity": 8.5,
  "technical_accuracy": 9.0,
  "professionalism": 8.0,
  "completeness": 7.5,
  "strengths": ["Clear explanations", "Good examples", "Logical structure"],
  "improvements": ["Could expand section X", "Add more context for Y"],
  "overall_assessment": "Well-written technical content with good clarity and accuracy."
}`;
}
