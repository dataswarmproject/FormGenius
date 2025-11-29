import { Prisma } from '@prisma/client'

// Form Builder Types
export interface FormField {
  id: string
  type: QuestionType
  label: string
  description?: string
  placeholder?: string
  required: boolean
  config: FieldConfig
  validation?: ValidationRule[]
  conditionalLogic?: ConditionalRule[]
  aiEvaluation?: AIEvaluationConfig
}

export type QuestionType =
  | 'SHORT_TEXT'
  | 'LONG_TEXT'
  | 'EMAIL'
  | 'PHONE'
  | 'NUMBER'
  | 'URL'
  | 'DATE'
  | 'TIME'
  | 'DATETIME'
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'DROPDOWN'
  | 'RATING'
  | 'SCALE'
  | 'MATRIX'
  | 'FILE_UPLOAD'
  | 'SIGNATURE'
  | 'SECTION_BREAK'
  | 'PAGE_BREAK'
  | 'STATEMENT'
  | 'RANKING'
  | 'CODE_EDITOR'
  | 'ESSAY'

export interface FieldConfig {
  // Text fields
  minLength?: number
  maxLength?: number
  pattern?: string

  // Choice fields
  options?: ChoiceOption[]
  allowOther?: boolean
  randomizeOptions?: boolean

  // Number fields
  min?: number
  max?: number
  step?: number

  // Rating/Scale
  minValue?: number
  maxValue?: number
  minLabel?: string
  maxLabel?: string

  // File upload
  allowedTypes?: string[]
  maxFileSize?: number
  maxFiles?: number

  // Matrix
  rows?: string[]
  columns?: string[]

  // Code editor
  language?: string
  theme?: string

  // Correct answer (for quizzes)
  correctAnswer?: any
  answerExplanation?: string
  points?: number
}

export interface ChoiceOption {
  id: string
  label: string
  value: string
  isCorrect?: boolean
  points?: number
}

export interface ValidationRule {
  type: 'required' | 'pattern' | 'minLength' | 'maxLength' | 'min' | 'max' | 'custom'
  value?: any
  message: string
  customValidator?: string
}

export interface ConditionalRule {
  id: string
  action: 'show' | 'hide' | 'require' | 'skip'
  conditions: Condition[]
  logicOperator: 'and' | 'or'
}

export interface Condition {
  fieldId: string
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'isEmpty' | 'isNotEmpty'
  value: any
}

export interface AIEvaluationConfig {
  enabled: boolean
  criteria: string
  maxScore: number
  rubric?: GradingRubric
  autoFeedback: boolean
  feedbackStyle: 'brief' | 'detailed' | 'constructive'
}

export interface GradingRubric {
  criteria: RubricCriterion[]
  totalPoints: number
  passingScore?: number
}

export interface RubricCriterion {
  id: string
  name: string
  description: string
  maxPoints: number
  levels: RubricLevel[]
}

export interface RubricLevel {
  score: number
  label: string
  description: string
}

// AI Evaluation Types
export interface EvaluationRequest {
  submissionId: string
  formId: string
  formType: string
  questions: QuestionWithAnswer[]
  evaluationConfig: FormAIConfig
}

export interface QuestionWithAnswer {
  questionId: string
  type: QuestionType
  label: string
  answer: any
  correctAnswer?: any
  evaluationCriteria?: string
  rubric?: GradingRubric
  maxScore: number
}

export interface FormAIConfig {
  enabled: boolean
  globalPrompt: string
  evaluationStyle: 'strict' | 'moderate' | 'lenient'
  feedbackLanguage?: string
  feedbackStyle: 'brief' | 'detailed' | 'constructive'
  includeExplanations: boolean
  detectPlagiarism: boolean
  sentimentAnalysis: boolean
  passingScore?: number
  gradingScale?: 'letter' | 'percentage' | 'points' | 'passfail'
}

export interface EvaluationResult {
  submissionId: string
  totalScore: number
  maxPossibleScore: number
  percentage: number
  grade: string
  passed: boolean
  overallFeedback: string
  questionResults: QuestionEvaluationResult[]
  insights: EvaluationInsights
  metadata: EvaluationMetadata
}

export interface QuestionEvaluationResult {
  questionId: string
  score: number
  maxScore: number
  feedback: string
  confidence: number
  rubricBreakdown?: RubricScore[]
  suggestions?: string[]
}

export interface RubricScore {
  criterionId: string
  score: number
  comment: string
}

export interface EvaluationInsights {
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  keyThemes: string[]
  comprehensionLevel: string
}

export interface EvaluationMetadata {
  modelUsed: string
  evaluationTime: number
  tokensUsed: number
  timestamp: string
}

// Google Sheets Types
export interface SheetConfig {
  spreadsheetId: string
  sheetName: string
  headerRow: number
  dataStartRow: number
  columnMapping: ColumnMapping[]
  syncDirection: 'to_sheet' | 'from_sheet' | 'bidirectional'
  syncFrequency: 'realtime' | 'hourly' | 'daily' | 'manual'
}

export interface ColumnMapping {
  fieldId: string
  fieldLabel: string
  columnLetter: string
  columnIndex: number
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'json'
  formula?: string
}

export interface SyncResult {
  success: boolean
  rowsCreated: number
  rowsUpdated: number
  rowsFailed: number
  errors: SyncError[]
  timestamp: string
}

export interface SyncError {
  message: string
  submissionId?: string
  row?: number
}

// Database Query Types
export type SubmissionWithAnswers = Prisma.SubmissionGetPayload<{
  include: {
    answers: true
    user: { select: { email: true; name: true } }
    form: { include: { questions: true } }
  }
}>

export type FormWithQuestions = Prisma.FormGetPayload<{
  include: { questions: true }
}>

export type FormWithDetails = Prisma.FormGetPayload<{
  include: {
    questions: true
    analytics: true
    _count: { select: { submissions: true } }
  }
}>

// AI Assistant Types
export interface GeneratedQuestion {
  type: QuestionType
  label: string
  description?: string
  options?: ChoiceOption[]
  correctAnswer?: any
  answerExplanation?: string
  points?: number
  evaluationCriteria?: string
}

export interface ResponseAnalysis {
  summary: string
  keyFindings: string[]
  sentiment: {
    overall: 'positive' | 'neutral' | 'negative'
    distribution: { positive: number; neutral: number; negative: number }
    highlights: string[]
  }
  themes: Array<{
    name: string
    frequency: number
    examples: string[]
    sentiment: 'positive' | 'neutral' | 'negative'
  }>
  trends: Array<{
    description: string
    direction: 'increasing' | 'decreasing' | 'stable'
    significance: 'high' | 'medium' | 'low'
  }>
  recommendations: string[]
  anomalies: string[]
}

export interface CompletionSuggestion {
  suggestions: string[]
  tips: string[]
  relatedPoints: string[]
  grammarCorrections: string[]
}

export interface QuestionImprovement {
  qualityScore: number
  issues: Array<{
    type: 'clarity' | 'bias' | 'difficulty' | 'accessibility' | 'options'
    severity: 'high' | 'medium' | 'low'
    description: string
    suggestion: string
  }>
  improvedVersion: FormField
  alternativePhrasings: string[]
}

export interface SubmissionSummary {
  id: string
  data: any
  score?: number
  grade?: string
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
