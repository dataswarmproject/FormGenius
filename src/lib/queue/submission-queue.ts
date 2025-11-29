import { Queue, Worker, Job } from 'bullmq'
import { prisma } from '@/lib/prisma'
import { AIEvaluationEngine } from '@/lib/ai/evaluation-engine'
import { GoogleSheetsIntegration } from '@/lib/google/sheets-integration'
import { FormAIConfig, QuestionWithAnswer, GradingRubric } from '@/types'

// Redis connection configuration
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
}

// Create the submission queue
export const submissionQueue = new Queue('submissions', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
})

// Job types
export type SubmissionJob =
  | { type: 'evaluate'; submissionId: string; formId: string }
  | { type: 'sync-sheet'; submissionId: string; spreadsheetId: string }
  | { type: 'send-notification'; data: any }
  | { type: 'analyze-responses'; formId: string }

// Add job to queue
export async function queueEvaluation(submissionId: string, formId: string) {
  return submissionQueue.add('evaluate', { submissionId, formId }, {
    priority: 1, // High priority
  })
}

export async function queueSheetSync(submissionId: string, spreadsheetId: string) {
  return submissionQueue.add('sync-sheet', { submissionId, spreadsheetId }, {
    priority: 2,
  })
}

export async function queueNotification(data: any) {
  return submissionQueue.add('send-notification', data, {
    priority: 3,
  })
}

export async function queueAnalysis(formId: string) {
  return submissionQueue.add('analyze-responses', { formId }, {
    priority: 4,
    delay: 60000, // Wait 1 minute before analyzing
  })
}

// Worker to process jobs
export function startWorker() {
  const worker = new Worker(
    'submissions',
    async (job: Job) => {
      console.log(`Processing job ${job.name} with ID ${job.id}`)

      try {
        switch (job.name) {
          case 'evaluate':
            return await processEvaluation(job.data)
          case 'sync-sheet':
            return await syncToSheet(job.data)
          case 'send-notification':
            return await sendNotification(job.data)
          case 'analyze-responses':
            return await analyzeResponses(job.data)
          default:
            throw new Error(`Unknown job type: ${job.name}`)
        }
      } catch (error) {
        console.error(`Error processing job ${job.id}:`, error)
        throw error
      }
    },
    {
      connection,
      concurrency: 5,
      limiter: {
        max: 10,
        duration: 1000,
      },
    }
  )

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed successfully`)
  })

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err)
  })

  return worker
}

// Job processors

async function processEvaluation(data: { submissionId: string; formId: string }) {
  console.log(`Evaluating submission ${data.submissionId}`)

  const submission = await prisma.submission.findUnique({
    where: { id: data.submissionId },
    include: {
      form: { include: { questions: true } },
      answers: true,
    },
  })

  if (!submission) {
    throw new Error('Submission not found')
  }

  if (submission.aiEvaluated) {
    console.log('Submission already evaluated, skipping')
    return { skipped: true }
  }

  // Update status to evaluating
  await prisma.submission.update({
    where: { id: submission.id },
    data: { status: 'EVALUATING' },
  })

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

  // Queue notification
  await queueNotification({
    type: 'evaluation_complete',
    submissionId: submission.id,
    userId: submission.userId,
    formOwnerId: submission.form.userId,
  })

  return { success: true, result }
}

async function syncToSheet(data: { submissionId: string; spreadsheetId: string }) {
  console.log(`Syncing submission ${data.submissionId} to sheet ${data.spreadsheetId}`)

  const submission = await prisma.submission.findUnique({
    where: { id: data.submissionId },
    include: {
      form: { include: { questions: true } },
      answers: true,
      user: { select: { email: true, name: true } },
    },
  })

  if (!submission) {
    throw new Error('Submission not found')
  }

  // Get Google credentials from user account
  const account = await prisma.account.findFirst({
    where: {
      userId: submission.form.userId,
      provider: 'google',
    },
  })

  if (!account || !account.access_token) {
    throw new Error('No Google credentials found')
  }

  const sheets = new GoogleSheetsIntegration({
    access_token: account.access_token,
    refresh_token: account.refresh_token || undefined,
  })

  const result = await sheets.syncSubmission(
    data.spreadsheetId,
    submission as any,
    submission.form.sheetMapping as any || {
      spreadsheetId: data.spreadsheetId,
      sheetName: 'Responses',
      headerRow: 1,
      dataStartRow: 2,
      columnMapping: [],
      syncDirection: 'to_sheet',
      syncFrequency: 'realtime',
    }
  )

  await prisma.submission.update({
    where: { id: submission.id },
    data: {
      syncedToSheet: result.success,
      lastSheetSync: new Date(),
    },
  })

  return { success: true, result }
}

async function sendNotification(data: any) {
  console.log('Sending notification:', data.type)

  switch (data.type) {
    case 'evaluation_complete':
      // TODO: Send email notification
      console.log(`Evaluation complete for submission ${data.submissionId}`)
      break

    case 'new_submission':
      // TODO: Notify form owner
      console.log(`New submission for form owner ${data.formOwnerId}`)
      break

    default:
      console.log('Unknown notification type:', data.type)
  }

  return { success: true }
}

async function analyzeResponses(data: { formId: string }) {
  console.log(`Analyzing responses for form ${data.formId}`)

  const form = await prisma.form.findUnique({
    where: { id: data.formId },
    include: {
      submissions: {
        where: { status: 'EVALUATED' },
        include: { answers: true },
        take: 1000,
      },
      analytics: true,
    },
  })

  if (!form) {
    throw new Error('Form not found')
  }

  // Calculate basic statistics
  const totalSubmissions = form.submissions.length
  const totalScore = form.submissions.reduce((sum, s) => sum + (s.finalScore || 0), 0)
  const averageScore = totalSubmissions > 0 ? totalScore / totalSubmissions : 0
  const passedCount = form.submissions.filter(s => s.passed).length
  const passRate = totalSubmissions > 0 ? passedCount / totalSubmissions : 0

  // Update or create analytics
  await prisma.formAnalytics.upsert({
    where: { formId: form.id },
    create: {
      formId: form.id,
      totalSubmissions,
      averageScore,
      passRate,
    },
    update: {
      totalSubmissions,
      averageScore,
      passRate,
      updatedAt: new Date(),
    },
  })

  return { success: true, totalSubmissions, averageScore, passRate }
}
