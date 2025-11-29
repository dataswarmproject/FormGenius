import { google, sheets_v4 } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { SheetConfig, SyncResult, SyncError, ColumnMapping, SubmissionWithAnswers } from '@/types'
import { Form, FormAnalytics } from '@prisma/client'

interface GoogleCredentials {
  access_token: string
  refresh_token?: string
  scope?: string
  token_type?: string
  expiry_date?: number
}

export class GoogleSheetsIntegration {
  private sheets: sheets_v4.Sheets
  private auth: OAuth2Client

  constructor(credentials: GoogleCredentials) {
    this.auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    this.auth.setCredentials({
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token,
      token_type: credentials.token_type,
      expiry_date: credentials.expiry_date,
    })

    this.sheets = google.sheets({ version: 'v4', auth: this.auth })
  }

  async createSpreadsheetForForm(form: Form & { questions: any[] }): Promise<string> {
    try {
      const response = await this.sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: `${form.title} - Responses`,
          },
          sheets: [
            {
              properties: {
                title: 'Responses',
                gridProperties: { frozenRowCount: 1 },
              },
            },
            {
              properties: { title: 'Analytics' },
            },
            {
              properties: { title: 'AI Evaluations' },
            },
          ],
        },
      })

      const spreadsheetId = response.data.spreadsheetId!

      // Set up headers
      await this.setupHeaders(spreadsheetId, form)

      // Apply formatting
      await this.applyFormatting(spreadsheetId)

      return spreadsheetId
    } catch (error) {
      console.error('Error creating spreadsheet:', error)
      throw new Error('Failed to create Google Sheet')
    }
  }

  async setupHeaders(spreadsheetId: string, form: Form & { questions: any[] }): Promise<void> {
    const headers = [
      'Submission ID',
      'Timestamp',
      'Status',
      'User Email',
      ...form.questions.map(q => q.label),
      'AI Score',
      'AI Grade',
      'AI Feedback',
      'Final Score',
      'Completion Time (s)',
    ]

    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Responses!A1',
      valueInputOption: 'RAW',
      requestBody: { values: [headers] },
    })
  }

  async applyFormatting(spreadsheetId: string): Promise<void> {
    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.6, green: 0.4, blue: 0.9 },
                  textFormat: {
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                    bold: true,
                  },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: 0,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: 20,
              },
            },
          },
        ],
      },
    })
  }

  async syncSubmission(
    spreadsheetId: string,
    submission: SubmissionWithAnswers,
    config: SheetConfig
  ): Promise<SyncResult> {
    try {
      const rowData = this.buildRowData(submission, config)

      if (submission.sheetRowNumber) {
        // Update existing row
        await this.sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `Responses!A${submission.sheetRowNumber}`,
          valueInputOption: 'RAW',
          requestBody: { values: [rowData] },
        })

        return {
          success: true,
          rowsCreated: 0,
          rowsUpdated: 1,
          rowsFailed: 0,
          errors: [],
          timestamp: new Date().toISOString(),
        }
      } else {
        // Append new row
        const response = await this.sheets.spreadsheets.values.append({
          spreadsheetId,
          range: 'Responses!A:A',
          valueInputOption: 'RAW',
          insertDataOption: 'INSERT_ROWS',
          requestBody: { values: [rowData] },
        })

        // Extract row number from the response
        const updatedRange = response.data.updates?.updatedRange
        const rowNumber = updatedRange ? parseInt(updatedRange.split('!')[1].match(/\d+/)?.[0] || '0') : 0

        return {
          success: true,
          rowsCreated: 1,
          rowsUpdated: 0,
          rowsFailed: 0,
          errors: [],
          timestamp: new Date().toISOString(),
        }
      }
    } catch (error) {
      console.error('Error syncing submission:', error)
      return {
        success: false,
        rowsCreated: 0,
        rowsUpdated: 0,
        rowsFailed: 1,
        errors: [{
          message: error instanceof Error ? error.message : 'Unknown error',
          submissionId: submission.id,
        }],
        timestamp: new Date().toISOString(),
      }
    }
  }

  async batchSync(
    spreadsheetId: string,
    submissions: SubmissionWithAnswers[],
    config: SheetConfig
  ): Promise<SyncResult> {
    const rows = submissions.map(s => this.buildRowData(s, config))

    try {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `Responses!A${config.dataStartRow}`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: rows },
      })

      return {
        success: true,
        rowsCreated: rows.length,
        rowsUpdated: 0,
        rowsFailed: 0,
        errors: [],
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      console.error('Error batch syncing:', error)
      return {
        success: false,
        rowsCreated: 0,
        rowsUpdated: 0,
        rowsFailed: submissions.length,
        errors: [{
          message: error instanceof Error ? error.message : 'Unknown error',
        }],
        timestamp: new Date().toISOString(),
      }
    }
  }

  async updateAnalyticsSheet(spreadsheetId: string, analytics: FormAnalytics): Promise<void> {
    const data = [
      ['Metric', 'Value'],
      ['Total Submissions', analytics.totalSubmissions.toString()],
      ['Completion Rate', `${(analytics.completionRate * 100).toFixed(1)}%`],
      ['Average Score', analytics.averageScore?.toFixed(2) || 'N/A'],
      ['Pass Rate', analytics.passRate ? `${(analytics.passRate * 100).toFixed(1)}%` : 'N/A'],
      ['Average Completion Time', `${Math.round((analytics.averageTime || 0) / 60)} min`],
      [''],
      ['AI Insights'],
      ...((analytics.aiInsights as any)?.keyFindings || []).map((f: string) => ['', f]),
    ]

    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Analytics!A1',
      valueInputOption: 'RAW',
      requestBody: { values: data },
    })
  }

  async readSubmissionsFromSheet(
    spreadsheetId: string,
    range: string = 'Responses!A2:Z1000'
  ): Promise<any[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      })

      return response.data.values || []
    } catch (error) {
      console.error('Error reading from sheet:', error)
      throw new Error('Failed to read from Google Sheet')
    }
  }

  private buildRowData(submission: SubmissionWithAnswers, config: SheetConfig): any[] {
    const row: any[] = [
      submission.id,
      submission.submittedAt.toISOString(),
      submission.status,
      submission.user?.email || 'Anonymous',
    ]

    // Add answers in order based on mapping
    if (config.columnMapping && config.columnMapping.length > 0) {
      config.columnMapping.forEach(mapping => {
        const answer = submission.answers.find(a => a.questionId === mapping.fieldId)
        row.push(this.formatValue(answer?.value, mapping.dataType))
      })
    } else {
      // Fallback: add all answers
      submission.answers.forEach(answer => {
        row.push(this.formatValue(answer.value, 'string'))
      })
    }

    // Add evaluation data
    row.push(
      submission.aiScore ?? '',
      submission.aiGrade ?? '',
      submission.aiFeedback ?? '',
      submission.finalScore ?? '',
      submission.completionTime ?? '',
    )

    return row
  }

  private formatValue(value: any, dataType: string): any {
    if (value === null || value === undefined) return ''

    switch (dataType) {
      case 'json':
        return JSON.stringify(value)
      case 'date':
        return new Date(value).toISOString()
      case 'boolean':
        return value ? 'Yes' : 'No'
      case 'number':
        return typeof value === 'number' ? value : parseFloat(value) || 0
      default:
        return String(value)
    }
  }

  async getSpreadsheetInfo(spreadsheetId: string): Promise<{
    title: string
    sheets: Array<{ title: string; sheetId: number }>
  }> {
    const response = await this.sheets.spreadsheets.get({
      spreadsheetId,
    })

    return {
      title: response.data.properties?.title || '',
      sheets: response.data.sheets?.map(s => ({
        title: s.properties?.title || '',
        sheetId: s.properties?.sheetId || 0,
      })) || [],
    }
  }
}
