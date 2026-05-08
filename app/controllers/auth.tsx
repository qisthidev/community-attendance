import type { BuildAction } from 'remix/fetch-router'

import type { routes } from '../routes.ts'
import { db } from '../data/db.ts'
import { Layout } from '../ui/layout.tsx'
import { render } from '../utils/render.tsx'
import { hashPassword, verifyPassword, createSession, setSessionCookie, clearSessionCookie, getSessionToken, deleteSession } from '../utils/auth.ts'
import { loginSchema, registerSchema } from '../utils/validation.ts'

export const auth: BuildAction<'GET' | 'POST', typeof routes.auth> = {
  async handler({ request }) {
    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'login'

    if (request.method === 'POST') {
      return handleAuthAction(request, action)
    }

    return render(<AuthPage action={action} />, request)
  },
}

async function handleAuthAction(request: Request, action: string) {
  const formData = await request.formData()
  const data = Object.fromEntries(formData)

  if (action === 'login') {
    const result = loginSchema.safeParse(data)
    if (!result.success) {
      return render(<AuthPage action="login" error={result.error.errors[0].message} />, request, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { email: result.data.email },
    })

    if (!user || !(await verifyPassword(result.data.password, user.passwordHash))) {
      return render(<AuthPage action="login" error="Invalid email or password" />, request, { status: 401 })
    }

    const token = await createSession(user.id)
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/dashboard',
        'Set-Cookie': setSessionCookie(token),
      },
    })
  }

  if (action === 'register') {
    const result = registerSchema.safeParse(data)
    if (!result.success) {
      return render(<AuthPage action="register" error={result.error.errors[0].message} />, request, { status: 400 })
    }

    const existing = await db.user.findUnique({
      where: { email: result.data.email },
    })

    if (existing) {
      return render(<AuthPage action="register" error="Email already registered" />, request, { status: 409 })
    }

    const passwordHash = await hashPassword(result.data.password)
    const user = await db.user.create({
      data: {
        name: result.data.name,
        email: result.data.email,
        passwordHash,
        subOrganizationId: result.data.subOrganizationId || null,
      },
    })

    const token = await createSession(user.id)
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/dashboard',
        'Set-Cookie': setSessionCookie(token),
      },
    })
  }

  if (action === 'logout') {
    const token = getSessionToken(request)
    if (token) {
      await deleteSession(token)
    }

    return new Response(null, {
      status: 302,
      headers: {
        Location: '/',
        'Set-Cookie': clearSessionCookie(),
      },
    })
  }

  return new Response('Invalid action', { status: 400 })
}

function AuthPage() {
  return ({ action, error }: { action: string; error?: string }) => (
    <Layout title={action === 'register' ? 'Sign Up' : 'Sign In'}>
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
              {action === 'register' ? 'Create your account' : 'Sign in to your account'}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {action === 'register' ? (
                <>
                  Already have an account?{' '}
                  <a href="/auth?action=login" className="font-medium text-primary-600 hover:text-primary-500">
                    Sign in
                  </a>
                </>
              ) : (
                <>
                  Don't have an account?{' '}
                  <a href="/auth?action=register" className="font-medium text-primary-600 hover:text-primary-500">
                    Sign up
                  </a>
                </>
              )}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form className="mt-8 space-y-6" method="POST" action={`/auth?action=${action}`}>
            {action === 'register' && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="John Doe"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={action === 'register' ? 'new-password' : 'current-password'}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 touch-target"
            >
              {action === 'register' ? 'Sign up' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  )
}
