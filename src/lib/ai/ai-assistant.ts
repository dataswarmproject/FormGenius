import { GoogleGenerativeAI } from '@google/generative-ai'
import {
  GeneratedQuestion,
  GradingRubric,
  ResponseAnalysis,
  CompletionSuggestion,
  QuestionImprovement,
  FormField,
  SubmissionSummary,
  QuestionType,
} from '@/types'

export class AIFormAssistant {
  private genAI: GoogleGenerativeAI
  private model: any

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
  }

  async generateFormQuestions(params: {
    topic: string
    formType: string
    difficulty: 'easy' | 'medium' | 'hard'
    numberOfQuestions: number
    includeAnswerKey: boolean
    language?: string
  }): Promise<GeneratedQuestion[]> {
    const prompt = `
Generate ${params.numberOfQuestions} ${params.difficulty} level questions for a ${params.formType} about "${params.topic}".

Requirements:
- Mix of question types (multiple choice, short answer, essay, etc.)
- Progressive difficulty within the set
- Clear, unambiguous wording
- ${params.includeAnswerKey ? 'Include correct answers and explanations' : 'Questions only'}
- Language: ${params.language || 'English'}

Return JSON array:
[{
  "type": "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "SHORT_TEXT" | "LONG_TEXT" | "ESSAY",
  "label": "question text",
  "description": "optional context or instructions",
  "options": [{ "id": "opt1", "label": "...", "value": "...", "isCorrect": boolean }], // for choice types
  "correctAnswer": "...", // for non-choice types
  "answerExplanation": "why this is the correct answer",
  "points": number,
  "evaluationCriteria": "criteria for grading open-ended responses"
}]`

    const response = await this.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    })

    return JSON.parse(response.response.text())
  }

  async generateRubric(params: {
    questionText: string
    questionType: QuestionType
    maxPoints: number
    context?: string
  }): Promise<GradingRubric> {
    const prompt = `
Create a detailed grading rubric for evaluating this question:

Question: "${params.questionText}"
Type: ${params.questionType}
Max Points: ${params.maxPoints}
${params.context ? `Context: ${params.context}` : ''}

Return JSON:
{
  "criteria": [{
    "id": "unique-id",
    "name": "criterion name (e.g., 'Content Accuracy', 'Critical Thinking')",
    "description": "what this criterion measures",
    "maxPoints": number,
    "levels": [
      {
        "score": number,
        "label": "Excellent/Good/Satisfactory/Needs Improvement",
        "description": "specific requirements for this level"
      }
    ]
  }],
  "totalPoints": ${params.maxPoints},
  "passingScore": number (recommended passing threshold)
}`

    const response = await this.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    })

    return JSON.parse(response.response.text())
  }

  async analyzeResponses(params: {
    formId: string
    submissions: SubmissionSummary[]
    analysisType: 'sentiment' | 'themes' | 'trends' | 'comprehensive'
  }): Promise<ResponseAnalysis> {
    const submissionData = params.submissions.slice(0, 100).map(s => ({
      id: s.id,
      responses: s.data,
      score: s.score,
      grade: s.grade,
    }))

    const prompt = `
Analyze these ${params.submissions.length} form submissions:

${JSON.stringify(submissionData, null, 2)}

Provide ${params.analysisType} analysis.

Return JSON:
{
  "summary": "2-3 sentence overall summary",
  "keyFindings": ["finding1", "finding2", "finding3"],
  "sentiment": {
    "overall": "positive" | "neutral" | "negative",
    "distribution": { "positive": percentage, "neutral": percentage, "negative": percentage },
    "highlights": ["notable positive/negative responses"]
  },
  "themes": [{
    "name": "theme name",
    "frequency": number of occurrences,
    "examples": ["example response snippets"],
    "sentiment": "positive" | "neutral" | "negative"
  }],
  "trends": [{
    "description": "observed trend description",
    "direction": "increasing" | "decreasing" | "stable",
    "significance": "high" | "medium" | "low"
  }],
  "recommendations": ["actionable recommendation1", "recommendation2"],
  "anomalies": ["unusual or outlier findings"]
}`

    const response = await this.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    })

    return JSON.parse(response.response.text())
  }

  async getCompletionSuggestion(params: {
    questionLabel: string
    questionType: QuestionType
    partialAnswer: string
    context?: string
  }): Promise<CompletionSuggestion> {
    const prompt = `
Help complete this form response (provide assistance, do NOT answer for the user):

Question: "${params.questionLabel}"
Type: ${params.questionType}
Current partial answer: "${params.partialAnswer}"
${params.context ? `Context: ${params.context}` : ''}

Return JSON:
{
  "suggestions": ["helpful suggestion1", "suggestion2"],
  "tips": ["tip for answering well"],
  "relatedPoints": ["related point they might want to consider"],
  "grammarCorrections": ["if any issues in partial answer"]
}`

    const response = await this.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
      },
    })

    return JSON.parse(response.response.text())
  }

  async improveQuestion(question: FormField): Promise<QuestionImprovement> {
    const prompt = `
Analyze and improve this form question:

${JSON.stringify(question, null, 2)}

Check for:
- Clarity and unambiguity
- Bias or leading language
- Appropriate difficulty
- Answer option quality (for choice questions)
- Accessibility concerns

Return JSON:
{
  "qualityScore": number (0-100),
  "issues": [{
    "type": "clarity" | "bias" | "difficulty" | "accessibility" | "options",
    "severity": "high" | "medium" | "low",
    "description": "issue description",
    "suggestion": "how to fix"
  }],
  "improvedVersion": { /* improved question object with same structure */ },
  "alternativePhrasings": ["alternative way to phrase this question", "another option"]
}`

    const response = await this.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    })

    return JSON.parse(response.response.text())
  }

  async generateFormTitle(params: {
    formType: string
    questions: string[]
    targetAudience?: string
  }): Promise<{ title: string; description: string; suggestions: string[] }> {
    const prompt = `
Generate a compelling form title and description:

Form Type: ${params.formType}
Questions: ${params.questions.join(', ')}
${params.targetAudience ? `Target Audience: ${params.targetAudience}` : ''}

Return JSON:
{
  "title": "concise, clear title",
  "description": "2-3 sentence description of the form's purpose",
  "suggestions": ["alternative title1", "alternative title2"]
}`

    const response = await this.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
      },
    })

    return JSON.parse(response.response.text())
  }

  async suggestConditionalLogic(questions: FormField[]): Promise<Array<{
    questionId: string
    suggestedLogic: any
    reasoning: string
  }>> {
    const prompt = `
Analyze these form questions and suggest smart conditional logic:

${JSON.stringify(questions, null, 2)}

Identify opportunities for:
- Showing/hiding questions based on previous answers
- Skip logic for efficiency
- Required field logic based on context

Return JSON array:
[{
  "questionId": "id of question to apply logic to",
  "suggestedLogic": {
    "action": "show" | "hide" | "require" | "skip",
    "conditions": [{
      "fieldId": "id of question to check",
      "operator": "equals" | "contains" | etc,
      "value": "value to check for"
    }],
    "logicOperator": "and" | "or"
  },
  "reasoning": "why this logic makes sense"
}]`

    const response = await this.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    })

    return JSON.parse(response.response.text())
  }
}
