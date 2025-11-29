import { GoogleGenerativeAI } from '@google/generative-ai'
import {
  EvaluationRequest,
  EvaluationResult,
  QuestionEvaluationResult,
  FormAIConfig,
  QuestionWithAnswer,
  GradingRubric,
} from '@/types'

export class AIEvaluationEngine {
  private genAI: GoogleGenerativeAI
  private model: any

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
  }

  async evaluateSubmission(request: EvaluationRequest): Promise<EvaluationResult> {
    const startTime = Date.now()

    try {
      // Build the evaluation prompt
      const systemPrompt = this.buildSystemPrompt(request)
      const userPrompt = this.buildUserPrompt(request)

      // Get AI evaluation
      const response = await this.model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }
        ],
        generationConfig: {
          temperature: 0.3,
          topP: 0.8,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      })

      const responseText = response.response.text()
      const result = JSON.parse(responseText)

      return {
        ...result,
        submissionId: request.submissionId,
        metadata: {
          modelUsed: 'gemini-2.0-flash-exp',
          evaluationTime: Date.now() - startTime,
          tokensUsed: response.response.usageMetadata?.totalTokenCount || 0,
          timestamp: new Date().toISOString(),
        },
      }
    } catch (error) {
      console.error('AI Evaluation Error:', error)
      throw new Error(`Failed to evaluate submission: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private buildSystemPrompt(request: EvaluationRequest): string {
    return `
You are an expert evaluator and grader for ${request.formType} submissions. Your task is to evaluate student/user responses with precision, fairness, and constructive feedback.

## Your Evaluation Framework

### Core Principles
1. **Accuracy**: Score responses based strictly on the provided criteria and rubrics
2. **Consistency**: Apply the same standards across all questions
3. **Constructiveness**: Provide feedback that helps the respondent improve
4. **Objectivity**: Evaluate content, not writing style (unless specifically required)

### Evaluation Style: ${request.evaluationConfig.evaluationStyle}
${request.evaluationConfig.evaluationStyle === 'strict' ?
  '- Apply exact matching for factual questions\n- Deduct points for partial answers\n- Require complete explanations' :
request.evaluationConfig.evaluationStyle === 'moderate' ?
  '- Accept reasonably equivalent answers\n- Award partial credit for partial understanding\n- Value effort while maintaining standards' :
  '- Focus on demonstrating core understanding\n- Be generous with partial credit\n- Emphasize learning over perfection'}

${request.evaluationConfig.globalPrompt ? `### Admin Instructions\n${request.evaluationConfig.globalPrompt}` : ''}

### Output Requirements
Respond with a JSON object containing:
{
  "totalScore": number,
  "maxPossibleScore": number,
  "percentage": number (0-100),
  "grade": string (A+, A, A-, B+, B, B-, C+, C, C-, D, F),
  "passed": boolean,
  "overallFeedback": string (2-3 paragraphs of constructive feedback),
  "questionResults": [
    {
      "questionId": string,
      "score": number,
      "maxScore": number,
      "feedback": string (detailed feedback for this question),
      "confidence": number (0-1, how confident you are in this evaluation),
      "rubricBreakdown": [{ "criterionId": string, "score": number, "comment": string }],
      "suggestions": [string] (specific improvement suggestions)
    }
  ],
  "insights": {
    "strengths": [string] (3-5 key strengths demonstrated),
    "weaknesses": [string] (3-5 areas for improvement),
    "recommendations": [string] (actionable next steps),
    "keyThemes": [string] (main themes in responses),
    "comprehensionLevel": string (Excellent/Good/Satisfactory/Needs Improvement/Poor)
  }
}`
  }

  private buildUserPrompt(request: EvaluationRequest): string {
    let prompt = '## Submission to Evaluate\n\n'

    request.questions.forEach((q, index) => {
      prompt += `### Question ${index + 1} (${q.maxScore} points)\n`
      prompt += `**ID:** ${q.questionId}\n`
      prompt += `**Type:** ${q.type}\n`
      prompt += `**Question:** ${q.label}\n`

      if (q.correctAnswer) {
        prompt += `**Expected Answer:** ${JSON.stringify(q.correctAnswer)}\n`
      }

      if (q.evaluationCriteria) {
        prompt += `**Evaluation Criteria:** ${q.evaluationCriteria}\n`
      }

      if (q.rubric) {
        prompt += `**Rubric:**\n`
        q.rubric.criteria.forEach(c => {
          prompt += `- ${c.name} (${c.maxPoints} pts): ${c.description}\n`
          c.levels.forEach(level => {
            prompt += `  - ${level.score} pts (${level.label}): ${level.description}\n`
          })
        })
      }

      prompt += `**Student's Answer:** ${JSON.stringify(q.answer)}\n\n`
    })

    return prompt
  }

  async evaluateEssay(
    essay: string,
    criteria: string,
    rubric?: GradingRubric,
    maxScore: number = 100
  ): Promise<QuestionEvaluationResult> {
    const prompt = `
Evaluate this essay response:

Essay: "${essay}"

Evaluation Criteria: ${criteria}

${rubric ? `Rubric:\n${JSON.stringify(rubric, null, 2)}` : ''}

Max Score: ${maxScore}

Provide a JSON response:
{
  "questionId": "essay",
  "score": number,
  "maxScore": ${maxScore},
  "feedback": string,
  "confidence": number,
  "rubricBreakdown": [{ "criterionId": string, "score": number, "comment": string }],
  "suggestions": [string]
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

  async detectPlagiarism(text: string, comparisonPool: string[]): Promise<{
    isPlagiarized: boolean
    confidence: number
    matches: Array<{ text: string; similarity: number }>
  }> {
    const prompt = `
Analyze this text for potential plagiarism:

Text to check: "${text}"

Comparison pool:
${comparisonPool.map((t, i) => `${i + 1}. "${t}"`).join('\n')}

Respond with JSON:
{
  "isPlagiarized": boolean,
  "confidence": number (0-1),
  "matches": [
    {
      "text": string (the matching text from pool),
      "similarity": number (0-1, how similar)
    }
  ]
}`

    const response = await this.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    })

    return JSON.parse(response.response.text())
  }

  async generateGradeFromScore(
    score: number,
    maxScore: number,
    gradingScale: 'letter' | 'percentage' | 'points' | 'passfail' = 'letter'
  ): string {
    const percentage = (score / maxScore) * 100

    switch (gradingScale) {
      case 'letter':
        if (percentage >= 97) return 'A+'
        if (percentage >= 93) return 'A'
        if (percentage >= 90) return 'A-'
        if (percentage >= 87) return 'B+'
        if (percentage >= 83) return 'B'
        if (percentage >= 80) return 'B-'
        if (percentage >= 77) return 'C+'
        if (percentage >= 73) return 'C'
        if (percentage >= 70) return 'C-'
        if (percentage >= 67) return 'D+'
        if (percentage >= 63) return 'D'
        if (percentage >= 60) return 'D-'
        return 'F'
      case 'percentage':
        return `${percentage.toFixed(1)}%`
      case 'points':
        return `${score}/${maxScore}`
      case 'passfail':
        return percentage >= 60 ? 'Pass' : 'Fail'
      default:
        return 'N/A'
    }
  }
}
