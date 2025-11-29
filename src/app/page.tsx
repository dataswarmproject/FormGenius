import Link from 'next/link'
import { Sparkles, FileText, Brain, Sheet, Zap, BarChart3 } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            AI-Powered Form Builder
          </div>

          <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-6">
            FormGenius
          </h1>

          <p className="text-xl text-gray-600 mb-8">
            Create intelligent forms with automated AI evaluation, seamless Google Sheets integration,
            and powerful analytics. Perfect for educators, HR professionals, and researchers.
          </p>

          <div className="flex gap-4 justify-center">
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition shadow-lg hover:shadow-xl"
            >
              Get Started
            </Link>
            <Link
              href="/features"
              className="px-8 py-4 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition shadow-lg hover:shadow-xl border border-gray-200"
            >
              View Features
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Powerful Features</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Brain className="w-8 h-8" />}
            title="AI Evaluation"
            description="Automatically grade essays, tests, and surveys with advanced AI powered by Gemini"
            color="purple"
          />

          <FeatureCard
            icon={<Sheet className="w-8 h-8" />}
            title="Google Sheets Sync"
            description="Real-time synchronization with Google Sheets for easy data management"
            color="green"
          />

          <FeatureCard
            icon={<FileText className="w-8 h-8" />}
            title="Form Builder"
            description="Intuitive drag-and-drop interface with 20+ question types"
            color="blue"
          />

          <FeatureCard
            icon={<Zap className="w-8 h-8" />}
            title="Smart Automation"
            description="Automated workflows, notifications, and custom triggers"
            color="yellow"
          />

          <FeatureCard
            icon={<BarChart3 className="w-8 h-8" />}
            title="Advanced Analytics"
            description="AI-powered insights, sentiment analysis, and trend detection"
            color="indigo"
          />

          <FeatureCard
            icon={<Sparkles className="w-8 h-8" />}
            title="AI Assistance"
            description="Generate questions, rubrics, and get intelligent suggestions"
            color="pink"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-12 text-center text-white shadow-2xl">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of educators and professionals using FormGenius
          </p>
          <Link
            href="/auth/signin"
            className="inline-block px-8 py-4 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition shadow-lg"
          >
            Sign Up Free
          </Link>
        </div>
      </section>
    </div>
  )
}

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  color: string
}

function FeatureCard({ icon, title, description, color }: FeatureCardProps) {
  const colorClasses = {
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    pink: 'bg-pink-100 text-pink-600',
  }[color]

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition border border-gray-100">
      <div className={`inline-flex p-3 rounded-lg ${colorClasses} mb-4`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}
