import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AIFormAssistant } from '@/lib/ai/ai-assistant'
import { z } from 'zod'

const generateQuestionsSchema = z.object({
  topic: z.string().min(1).max(500),
  formType: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  numberOfQuestions: z.number().min(1).max(50),
  includeAnswerKey: z.boolean(),
  language: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const params = generateQuestionsSchema.parse(body)

    const assistant = new AIFormAssistant()
    const questions = await assistant.generateFormQuestions(params)

    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Error generating questions:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Failed to generate questions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
