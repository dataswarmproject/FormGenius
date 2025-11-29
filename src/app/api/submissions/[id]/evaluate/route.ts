import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AIEvaluationEngine } from '@/lib/ai/evaluation-engine'
import { FormAIConfig, QuestionWithAnswer, GradingRubric } from '@/types'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const submission = await prisma.submission.findUnique({
      where: { id: params.id },
      include: {
        form: { include: { questions: true } },
        answers: true,
      },
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Check ownership
    if (submission.form.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const engine = new AIEvaluationEngine()

    const questionsWithAnswers: QuestionWithAnswer[] = submission.form.questions.map(q => ({
      questionId: q.id,
      type: q.type as any,
      label: q.label,
      answer: submission.answers.find(a => a.questionId === q.id)?.value,
      correctAnswer: q.correctAnswer || undefined,
      evaluationCriteria: q.evaluationCriteria || undefined,
      rubric: q.rubric as GradingRubric | undefined,
      maxScore: q.maxScore || 0,
    }))

    const result = await engine.evaluateSubmission({
      submissionId: submission.id,
      formId: submission.formId,
      formType: submission.form.type,
      questions: questionsWithAnswers,
      evaluationConfig: submission.form.aiConfig as FormAIConfig,
    })

    // Update submission with results
    await prisma.submission.update({
      where: { id: submission.id },
      data: {
        aiEvaluated: true,
        aiScore: result.totalScore,
        aiGrade: result.grade,
        aiFeedback: result.overallFeedback,
        aiAnalysis: result as any,
        evaluatedAt: new Date(),
        status: 'EVALUATED',
        finalScore: result.totalScore,
        finalGrade: result.grade,
        passed: result.passed,
      },
    })

    // Update individual answer scores
    for (const qResult of result.questionResults) {
      await prisma.answer.update({
        where: {
          submissionId_questionId: {
            submissionId: submission.id,
            questionId: qResult.questionId,
          },
        },
        data: {
          aiScore: qResult.score,
          aiMaxScore: qResult.maxScore,
          aiFeedback: qResult.feedback,
          aiConfidence: qResult.confidence,
        },
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error evaluating submission:', error)
    return NextResponse.json(
      { error: 'Failed to evaluate submission', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
