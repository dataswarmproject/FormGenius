import { z } from 'zod'

export const questionSchema = z.object({
  id: z.string(),
  type: z.enum([
    'SHORT_TEXT', 'LONG_TEXT', 'EMAIL', 'PHONE', 'NUMBER', 'URL',
    'DATE', 'TIME', 'DATETIME', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE',
    'DROPDOWN', 'RATING', 'SCALE', 'MATRIX', 'FILE_UPLOAD', 'SIGNATURE',
    'SECTION_BREAK', 'PAGE_BREAK', 'STATEMENT', 'RANKING', 'CODE_EDITOR', 'ESSAY'
  ]),
  label: z.string().min(1).max(1000),
  description: z.string().max(2000).optional(),
  placeholder: z.string().max(500).optional(),
  required: z.boolean().default(false),
  config: z.record(z.any()),
  validation: z.array(z.object({
    type: z.enum(['required', 'pattern', 'minLength', 'maxLength', 'min', 'max', 'custom']),
    value: z.any().optional(),
    message: z.string(),
  })).optional(),
  conditionalLogic: z.array(z.object({
    id: z.string(),
    action: z.enum(['show', 'hide', 'require', 'skip']),
    conditions: z.array(z.object({
      fieldId: z.string(),
      operator: z.enum(['equals', 'notEquals', 'contains', 'greaterThan', 'lessThan', 'isEmpty', 'isNotEmpty']),
      value: z.any(),
    })),
    logicOperator: z.enum(['and', 'or']),
  })).optional(),
  aiEvaluation: z.object({
    enabled: z.boolean(),
    criteria: z.string().max(5000),
    maxScore: z.number().min(0).max(1000),
    autoFeedback: z.boolean(),
    feedbackStyle: z.enum(['brief', 'detailed', 'constructive']),
  }).optional(),
  order: z.number(),
  maxScore: z.number().optional(),
  correctAnswer: z.any().optional(),
  answerExplanation: z.string().optional(),
})

export const formSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  type: z.enum(['SURVEY', 'QUIZ', 'TEST', 'ASSESSMENT', 'FEEDBACK', 'REGISTRATION', 'APPLICATION', 'POLL', 'CUSTOM']),
  workspaceId: z.string().optional(),
  settings: z.object({
    showProgressBar: z.boolean().default(true),
    shuffleQuestions: z.boolean().default(false),
    allowBackNavigation: z.boolean().default(true),
    showQuestionNumbers: z.boolean().default(true),
    confirmBeforeSubmit: z.boolean().default(true),
    successMessage: z.string().max(1000).optional(),
    redirectUrl: z.string().url().optional(),
  }).optional(),
  aiConfig: z.object({
    enabled: z.boolean(),
    globalPrompt: z.string().max(10000),
    evaluationStyle: z.enum(['strict', 'moderate', 'lenient']),
    feedbackStyle: z.enum(['brief', 'detailed', 'constructive']),
    includeExplanations: z.boolean(),
    detectPlagiarism: z.boolean(),
    sentimentAnalysis: z.boolean(),
    passingScore: z.number().min(0).max(100).optional(),
    gradingScale: z.enum(['letter', 'percentage', 'points', 'passfail']).optional(),
  }).optional(),
  opensAt: z.string().datetime().optional(),
  closesAt: z.string().datetime().optional(),
  maxSubmissions: z.number().min(1).optional(),
})

export const submissionSchema = z.object({
  formId: z.string(),
  answers: z.record(z.any()),
  metadata: z.object({
    userAgent: z.string().optional(),
    ip: z.string().optional(),
    startedAt: z.string().datetime().optional(),
  }).optional(),
})

export const updateFormSchema = formSchema.partial()
