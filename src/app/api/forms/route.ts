import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formSchema } from '@/lib/validations/form'
import { generateSlug } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const workspaceId = searchParams.get('workspaceId')
  const status = searchParams.get('status')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')

  const where: any = {
    userId: session.user.id,
  }

  if (workspaceId) where.workspaceId = workspaceId
  if (status) where.status = status

  try {
    const [forms, total] = await Promise.all([
      prisma.form.findMany({
        where,
        include: {
          _count: { select: { submissions: true } },
          analytics: { select: { completionRate: true, averageScore: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.form.count({ where }),
    ])

    return NextResponse.json({
      forms,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching forms:', error)
    return NextResponse.json({ error: 'Failed to fetch forms' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const validatedData = formSchema.parse(body)

    const slug = generateSlug(validatedData.title)

    const form = await prisma.form.create({
      data: {
        ...validatedData,
        slug,
        userId: session.user.id,
        schema: {},
        settings: validatedData.settings || {},
        aiConfig: validatedData.aiConfig || null,
      },
    })

    return NextResponse.json(form, { status: 201 })
  } catch (error) {
    console.error('Error creating form:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create form' }, { status: 500 })
  }
}
