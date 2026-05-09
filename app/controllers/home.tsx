import type { BuildAction } from 'remix/fetch-router'

import type { routes } from '../routes.ts'
import { Document } from '../ui/document.tsx'
import { render } from '../utils/render.tsx'
import { getSessionToken, getSessionUser } from '../utils/auth.ts'

export const home: BuildAction<'GET', typeof routes.home> = {
  async handler({ request }) {
    // Check if user is already logged in
    const token = getSessionToken(request)
    const user = await getSessionUser(token)

    if (user) {
      return new Response(null, {
        status: 302,
        headers: { Location: '/dashboard' },
      })
    }

    return render(<HomePage />, request)
  },
}

function HomePage() {
  return () => (
    <Document title="Community Attendance">
      <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-lg mb-4">
              <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Community Attendance</h1>
            <p className="text-primary-100">Track attendance for your community events</p>
          </div>

          {/* Features */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-lg">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-semibold text-gray-900">QR Code Check-In</h3>
                  <p className="text-sm text-gray-600">Quick and contactless attendance tracking</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-lg">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-semibold text-gray-900">Real-Time Stats</h3>
                  <p className="text-sm text-gray-600">Track attendance rates and history</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-lg">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-semibold text-gray-900">Mobile-First</h3>
                  <p className="text-sm text-gray-600">Optimized for smartphones and tablets</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <a
              href="/auth?action=login"
              className="block w-full py-3 px-4 bg-white text-primary-600 text-center rounded-lg font-semibold shadow-lg hover:bg-gray-50 transition touch-target"
            >
              Sign In
            </a>
            <a
              href="/auth?action=register"
              className="block w-full py-3 px-4 bg-primary-800 text-white text-center rounded-lg font-semibold hover:bg-primary-900 transition touch-target"
            >
              Create Account
            </a>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-primary-100">
              Powered by Remix • Mobile-First Design
            </p>
          </div>
        </div>
      </div>
    </Document>
  )
}
