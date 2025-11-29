'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm, FormProvider } from 'react-hook-form'
import { Sparkles, Send, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormQuestion } from '@/components/forms/FormQuestion'
import { toast } from 'sonner'

export default function PublicFormPage() {
  const params = useParams()
  const router = useRouter()
  const [form, setForm] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const methods = useForm()
  const startTime = new Date()

  useEffect(() => {
    loadForm()
  }, [params.slug])

  async function loadForm() {
    try {
      const res = await fetch(`/api/forms/${params.slug}`)
      if (!res.ok) throw new Error('Form not found')
      const data = await res.json()
      setForm(data)
    } catch (error) {
      toast.error('Failed to load form')
    } finally {
      setLoading(false)
    }
  }

  async function onSubmit(data: any) {
    if (!form) return

    setSubmitting(true)
    const completionTime = Math.floor((new Date().getTime() - startTime.getTime()) / 1000)

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId: form.id,
          answers: data,
          metadata: {
            userAgent: navigator.userAgent,
            startedAt: startTime.toISOString(),
            completionTime,
          },
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit')
      }

      setSubmitted(true)
      toast.success('Form submitted successfully!')

      // If AI evaluation is enabled, show evaluation message
      if (form.aiConfig?.enabled) {
        toast.info('Your responses are being evaluated by AI...')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit form')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading form...</p>
        </div>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="text-center">
          <p className="text-xl text-gray-600">Form not found</p>
        </div>
      </div>
    )
  }

  if (form.status !== 'PUBLISHED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="text-center">
          <p className="text-xl text-gray-600">This form is not currently accepting responses</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {form.settings?.successMessage || 'Thank you!'}
            </h2>
            <p className="text-gray-600 mb-6">
              Your response has been recorded successfully.
            </p>
            {form.aiConfig?.enabled && (
              <div className="bg-purple-50 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-purple-700 mb-2">
                  <Sparkles className="w-5 h-5" />
                  <span className="font-semibold">AI Evaluation</span>
                </div>
                <p className="text-sm text-purple-600">
                  Your responses are being evaluated. You'll receive detailed feedback shortly.
                </p>
              </div>
            )}
            {form.settings?.redirectUrl && (
              <Button
                onClick={() => window.location.href = form.settings.redirectUrl}
                className="w-full"
              >
                Continue
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Form Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {form.title}
          </h1>
          {form.description && (
            <p className="text-gray-600 whitespace-pre-wrap">
              {form.description}
            </p>
          )}
          {form.aiConfig?.enabled && (
            <div className="mt-4 flex items-center gap-2 text-purple-600 text-sm">
              <Sparkles className="w-4 h-4" />
              <span>This form uses AI evaluation</span>
            </div>
          )}
        </div>

        {/* Form Questions */}
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
            {form.questions?.sort((a: any, b: any) => a.order - b.order).map((question: any) => (
              <div key={question.id} className="bg-white rounded-xl shadow-lg p-6">
                <FormQuestion question={question} />
              </div>
            ))}

            {/* Submit Button */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-12 text-lg"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Submit Form
                  </>
                )}
              </Button>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  )
}
