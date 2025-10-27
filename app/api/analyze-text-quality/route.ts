import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { text, context } = await request.json()

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    // Use GPT-4 to analyze text quality
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Faster and cheaper for text analysis
      messages: [
        {
          role: 'system',
          content: context === 'initial employer contact message'
            ? `You are analyzing a professional's first message to a potential employer. Rate STRICTLY on:
1. Spelling & Grammar (0-10): Typos, grammar errors, punctuation mistakes
2. Professional Manners (0-10): Politeness, respect, appropriate tone
3. Composition & Clarity (0-10): Clear structure, concise writing, easy to understand

DO NOT judge:
- Technical knowledge or skills
- Work experience or qualifications
- Message length (brief is fine)
- Industry-specific jargon

Respond ONLY with valid JSON in this exact format:
{
  "grammar_score": <number 0-10>,
  "professionalism_score": <number 0-10>,
  "clarity_score": <number 0-10>,
  "overall_score": <number 0-10>,
  "feedback": "<brief explanation focusing on writing quality only>",
  "issues": ["<specific spelling/grammar/punctuation issues only>"]
}

Be fair - judge writing quality only, not content.`
            : `You are a professional writing quality analyzer. Evaluate the following text for:
1. Grammar and spelling (0-10 scale)
2. Professional tone (0-10 scale)
3. Clarity and structure (0-10 scale)

Context: ${context || 'professional profile'}

Respond ONLY with valid JSON in this exact format:
{
  "grammar_score": <number 0-10>,
  "professionalism_score": <number 0-10>,
  "clarity_score": <number 0-10>,
  "overall_score": <number 0-10>,
  "feedback": "<brief explanation of the score>",
  "issues": ["<specific issue 1>", "<specific issue 2>"]
}

Be strict but fair. Professional writing standards apply.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.3, // Low temperature for consistent scoring
      max_tokens: 500,
      response_format: { type: "json_object" }
    })

    const analysis = JSON.parse(completion.choices[0].message.content || '{}')

    // Calculate final score (0-10)
    const finalScore = (
      (analysis.grammar_score * 0.4) + 
      (analysis.professionalism_score * 0.3) + 
      (analysis.clarity_score * 0.3)
    )

    return NextResponse.json({
      success: true,
      score: Math.round(finalScore * 10) / 10, // Round to 1 decimal
      details: analysis,
      text_length: text.length,
      analyzed_at: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Text analysis error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to analyze text',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
