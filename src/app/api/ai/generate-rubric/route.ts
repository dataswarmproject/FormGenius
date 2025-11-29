import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AIFormAssistant } from '@/lib/ai/ai-assistant'
import { z } from 'zod'

const generateRubricSchema = z.object({
  questionText: z.string(),
  questionType: z.string(),
  maxPoints: z.number(),
  context: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const params = generateRubricSchema.parse(body)

    const assistant = new AIFormAssistant()
    const rubric = await assistant.generateRubric(params as any)

    return NextResponse.json(rubric)
  } catch (error) {
    console.error('Error generating rubric:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Failed to generate rubric', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
