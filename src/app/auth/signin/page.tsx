'use client'

import { signIn } from 'next-auth/react'
import { Chrome, ArrowRight } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

export default function SignInPage() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              FormGenius
            </h1>
            <p className="text-gray-600">Sign in to continue</p>
          </div>

          {/* Sign In Button */}
          <button
            onClick={() => signIn('google', { callbackUrl })}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 rounded-lg px-6 py-4 font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition shadow-sm hover:shadow-md group"
          >
            <Chrome className="w-5 h-5 text-gray-600" />
            <span>Continue with Google</span>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition" />
          </button>

          <p className="text-xs text-gray-500 text-center mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="text-sm">
            <div className="text-2xl font-bold text-purple-600">AI</div>
            <div className="text-gray-600">Powered</div>
          </div>
          <div className="text-sm">
            <div className="text-2xl font-bold text-blue-600">Smart</div>
            <div className="text-gray-600">Analytics</div>
          </div>
          <div className="text-sm">
            <div className="text-2xl font-bold text-green-600">Easy</div>
            <div className="text-gray-600">Integration</div>
          </div>
        </div>
      </div>
    </div>
  )
}
