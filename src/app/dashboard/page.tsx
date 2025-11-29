'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Plus, FileText, BarChart3, Settings, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormCard } from '@/components/dashboard/FormCard'
import { StatsCard } from '@/components/dashboard/StatsCard'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/dashboard')
    }
  }, [status, router])

  const { data, isLoading } = useQuery({
    queryKey: ['forms'],
    queryFn: async () => {
      const res = await fetch('/api/forms')
      if (!res.ok) throw new Error('Failed to fetch forms')
      return res.json()
    },
    enabled: !!session,
  })

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  const forms = data?.forms || []
  const stats = {
    totalForms: forms.length,
    totalSubmissions: forms.reduce((sum: number, f: any) => sum + (f._count?.submissions || 0), 0),
    avgCompletionRate: forms.reduce((sum: number, f: any) => sum + (f.analytics?.completionRate || 0), 0) / (forms.length || 1),
    avgScore: forms.reduce((sum: number, f: any) => sum + (f.analytics?.averageScore || 0), 0) / (forms.length || 1),
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                FormGenius
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <img
                src={session.user.image || ''}
                alt={session.user.name || ''}
                className="w-8 h-8 rounded-full"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {session.user.name?.split(' ')[0]}!
          </h2>
          <p className="text-gray-600">
            Manage your forms, view analytics, and leverage AI-powered insights
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Forms"
            value={stats.totalForms}
            icon={<FileText className="w-5 h-5" />}
            color="purple"
          />
          <StatsCard
            title="Total Submissions"
            value={stats.totalSubmissions}
            icon={<BarChart3 className="w-5 h-5" />}
            color="blue"
          />
          <StatsCard
            title="Avg Completion"
            value={`${(stats.avgCompletionRate * 100).toFixed(1)}%`}
            icon={<Sparkles className="w-5 h-5" />}
            color="green"
          />
          <StatsCard
            title="Avg Score"
            value={stats.avgScore ? `${stats.avgScore.toFixed(1)}%` : 'N/A'}
            icon={<BarChart3 className="w-5 h-5" />}
            color="indigo"
          />
        </div>

        {/* Forms Section */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Your Forms</h3>
          <Link href="/dashboard/forms/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Form
            </Button>
          </Link>
        </div>

        {forms.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
            <Sparkles className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No forms yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first AI-powered form to get started
            </p>
            <Link href="/dashboard/forms/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Form
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map((form: any) => (
              <FormCard key={form.id} form={form} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
