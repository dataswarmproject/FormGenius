import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { submissionSchema } from '@/lib/validations/form'
import { z } from 'zod'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = submissionSchema.parse(body)

    // Validate form exists and is accepting submissions
    const form = await prisma.form.findUnique({
      where: { id: validatedData.formId },
      include: { questions: true },
    })

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    if (form.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Form is not accepting submissions' }, { status: 400 })
    }

    // Check if form is within time range
    const now = new Date()
    if (form.opensAt && now < form.opensAt) {
      return NextResponse.json({ error: 'Form not yet open' }, { status: 400 })
    }
    if (form.closesAt && now > form.closesAt) {
      return NextResponse.json({ error: 'Form has closed' }, { status: 400 })
    }

    // Check submission limits
    if (form.maxSubmissions) {
      const count = await prisma.submission.count({ where: { formId: validatedData.formId } })
      if (count >= form.maxSubmissions) {
        return NextResponse.json({ error: 'Submission limit reached' }, { status: 400 })
      }
    }

    // Create submission
    const submission = await prisma.submission.create({
      data: {
        formId: validatedData.formId,
        data: validatedData.answers,
        metadata: validatedData.metadata || {},
        status: 'SUBMITTED',
        answers: {
          create: Object.entries(validatedData.answers).map(([questionId, value]) => ({
            questionId,
            value: value as any,
          })),
        },
      },
      include: { answers: true },
    })

    // Update form submission count
    await prisma.form.update({
      where: { id: form.id },
      data: { submissionCount: { increment: 1 } },
    })

    // TODO: Queue for AI evaluation and Google Sheets sync
    // This will be handled by the background job processor

    return NextResponse.json(submission, { status: 201 })
  } catch (error) {
    console.error('Error creating submission:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 })
  }
}
