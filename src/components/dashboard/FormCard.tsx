import { FileText, Users, Clock, BarChart3 } from 'lucide-react'
import Link from 'next/link'

interface FormCardProps {
  form: {
    id: string
    title: string
    description?: string
    status: string
    type: string
    createdAt: string
    _count?: {
      submissions: number
    }
    analytics?: {
      completionRate: number
      averageScore?: number
    }
  }
}

export function FormCard({ form }: FormCardProps) {
  const statusColors = {
    DRAFT: 'bg-gray-100 text-gray-700',
    PUBLISHED: 'bg-green-100 text-green-700',
    CLOSED: 'bg-red-100 text-red-700',
    ARCHIVED: 'bg-yellow-100 text-yellow-700',
  }

  const typeIcons = {
    SURVEY: '📋',
    QUIZ: '❓',
    TEST: '📝',
    ASSESSMENT: '📊',
    FEEDBACK: '💬',
    REGISTRATION: '✍️',
    APPLICATION: '📄',
    POLL: '📊',
    CUSTOM: '⚙️',
  }

  return (
    <Link href={`/dashboard/forms/${form.id}`}>
      <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-purple-300 hover:shadow-lg transition group cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{typeIcons[form.type as keyof typeof typeIcons]}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[form.status as keyof typeof statusColors]}`}>
              {form.status}
            </span>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition">
          {form.title}
        </h3>

        {form.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {form.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>{form._count?.submissions || 0} responses</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <BarChart3 className="w-4 h-4" />
            <span>{form.analytics?.completionRate ? `${(form.analytics.completionRate * 100).toFixed(0)}%` : '0%'}</span>
          </div>
        </div>

        {form.analytics?.averageScore !== undefined && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Avg Score</span>
              <span className="font-semibold text-purple-600">
                {form.analytics.averageScore.toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
