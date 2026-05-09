import { createRouter } from 'remix/fetch-router'
import { readFile } from 'node:fs/promises'
import { join, resolve, sep } from 'node:path'

import { assets } from './assets.ts'
import { auth } from './controllers/auth.tsx'
import { home } from './controllers/home.tsx'
import { dashboard } from './controllers/dashboard.tsx'
import { events } from './controllers/events.tsx'
import { attendance } from './controllers/attendance.tsx'
import { admin } from './controllers/admin.tsx'
import { routes } from './routes.ts'

export const router = createRouter()

router.get(routes.assets, async ({ request }) => {
  let response = await assets.fetch(request)
  return response ?? new Response('Not Found', { status: 404 })
})

// Serve static CSS files with Tailwind processing
router.get('/styles/*path', async ({ request }) => {
  const url = new URL(request.url)
  const pathname = decodeURIComponent(url.pathname.replace('/styles/', ''))
  const stylesDir = join(process.cwd(), 'app', 'styles')

  try {
    if (!pathname.endsWith('.css')) {
      return new Response('Not Found', { status: 404 })
    }

    const cssPath = resolve(stylesDir, pathname)
    if (cssPath !== stylesDir && !cssPath.startsWith(stylesDir + sep)) {
      return new Response('Not Found', { status: 404 })
    }

    let content = await readFile(cssPath, 'utf-8')

    // Simple replacement for Tailwind v4 import syntax
    // In production, this should be pre-compiled
    if (content.includes('@import "tailwindcss"')) {
      // Load a basic Tailwind CSS for development
      // This is a simplified approach - in production you'd use a build step
      const tailwindBase = `
/* Tailwind CSS Base (simplified for development) */
*, ::before, ::after { box-sizing: border-box; border-width: 0; border-style: solid; border-color: #e5e7eb; }
html { line-height: 1.5; -webkit-text-size-adjust: 100%; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif; }
body { margin: 0; line-height: inherit; }
h1, h2, h3, h4, h5, h6 { font-size: inherit; font-weight: inherit; }
a { color: inherit; text-decoration: inherit; }
button, input, select, textarea { font-family: inherit; font-size: 100%; line-height: inherit; color: inherit; margin: 0; padding: 0; }
button, select { text-transform: none; }
button, [type='button'], [type='reset'], [type='submit'] { -webkit-appearance: button; background-color: transparent; background-image: none; }
img, svg, video { display: block; vertical-align: middle; max-width: 100%; height: auto; }

/* Tailwind Utilities */
.bg-gray-50 { background-color: #f9fafb; }
.bg-gray-100 { background-color: #f3f4f6; }
.bg-gray-600 { background-color: #4b5563; }
.bg-gray-900 { background-color: #111827; }
.bg-white { background-color: #ffffff; }
.bg-green-100 { background-color: #dcfce7; }
.bg-green-600 { background-color: #16a34a; }
.bg-green-700 { background-color: #15803d; }
.bg-blue-100 { background-color: #dbeafe; }
.bg-yellow-100 { background-color: #fef3c7; }
.bg-red-50 { background-color: #fef2f2; }
.bg-red-100 { background-color: #fee2e2; }
.bg-primary-100 { background-color: #e0f2fe; }
.bg-primary-500 { background-color: #0ea5e9; }
.bg-primary-600 { background-color: #0284c7; }
.bg-primary-700 { background-color: #0369a1; }
.bg-primary-800 { background-color: #075985; }
.bg-primary-900 { background-color: #0c4a6e; }
.bg-gradient-to-br { background-image: linear-gradient(to bottom right, var(--tw-gradient-stops)); }
.from-primary-500 { --tw-gradient-from: #0ea5e9; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(14, 165, 233, 0)); }
.via-primary-600 { --tw-gradient-stops: var(--tw-gradient-from), #0284c7, var(--tw-gradient-to, rgba(2, 132, 199, 0)); }
.to-primary-700 { --tw-gradient-to: #0369a1; }
.text-gray-500 { color: #6b7280; }
.text-gray-600 { color: #4b5563; }
.text-gray-700 { color: #374151; }
.text-gray-900 { color: #111827; }
.text-white { color: #ffffff; }
.text-green-600 { color: #16a34a; }
.text-green-800 { color: #166534; }
.text-blue-800 { color: #1e40af; }
.text-yellow-800 { color: #854d0e; }
.text-red-700 { color: #b91c1c; }
.text-red-800 { color: #991b1b; }
.text-primary-100 { color: #e0f2fe; }
.text-primary-500 { color: #0ea5e9; }
.text-primary-600 { color: #0284c7; }
.border { border-width: 1px; }
.border-t { border-top-width: 1px; }
.border-b-2 { border-bottom-width: 2px; }
.border-gray-200 { border-color: #e5e7eb; }
.border-gray-300 { border-color: #d1d5db; }
.border-red-200 { border-color: #fecaca; }
.border-primary-500 { border-color: #0ea5e9; }
.border-transparent { border-color: transparent; }
.rounded { border-radius: 0.25rem; }
.rounded-lg { border-radius: 0.5rem; }
.rounded-2xl { border-radius: 1rem; }
.rounded-full { border-radius: 9999px; }
.shadow { box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1); }
.shadow-sm { box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }
.shadow-lg { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); }
.shadow-xl { box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1); }
.flex { display: flex; }
.inline-flex { display: inline-flex; }
.block { display: block; }
.items-start { align-items: flex-start; }
.items-center { align-items: center; }
.items-stretch { align-items: stretch; }
.justify-start { justify-content: flex-start; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.justify-around { justify-content: space-around; }
.flex-col { flex-direction: column; }
.flex-1 { flex: 1 1 0%; }
.flex-shrink-0 { flex-shrink: 0; }
.space-y-3 > * + * { margin-top: 0.75rem; }
.space-y-4 > * + * { margin-top: 1rem; }
.space-y-6 > * + * { margin-top: 1.5rem; }
.space-y-8 > * + * { margin-top: 2rem; }
.space-x-8 > * + * { margin-left: 2rem; }
.gap-2 { gap: 0.5rem; }
.gap-4 { gap: 1rem; }
.divide-y > * + * { border-top-width: 1px; }
.w-full { width: 100%; }
.w-6 { width: 1.5rem; }
.w-10 { width: 2.5rem; }
.w-12 { width: 3rem; }
.w-20 { width: 5rem; }
.w-32 { width: 8rem; }
.h-6 { height: 1.5rem; }
.h-10 { height: 2.5rem; }
.h-12 { height: 3rem; }
.h-20 { height: 5rem; }
.h-32 { height: 8rem; }
.min-h-screen { min-height: 100vh; }
.max-w-md { max-width: 28rem; }
.max-w-7xl { max-width: 80rem; }
.p-4 { padding: 1rem; }
.p-6 { padding: 1.5rem; }
.px-1 { padding-left: 0.25rem; padding-right: 0.25rem; }
.px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
.py-4 { padding-top: 1rem; padding-bottom: 1rem; }
.py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
.py-8 { padding-top: 2rem; padding-bottom: 2rem; }
.py-12 { padding-top: 3rem; padding-bottom: 3rem; }
.mt-1 { margin-top: 0.25rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-4 { margin-top: 1rem; }
.mt-6 { margin-top: 1.5rem; }
.mt-8 { margin-top: 2rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-6 { margin-bottom: 1.5rem; }
.mb-8 { margin-bottom: 2rem; }
.ml-4 { margin-left: 1rem; }
.mr-4 { margin-right: 1rem; }
.-mt-6 { margin-top: -1.5rem; }
.pb-24 { padding-bottom: 6rem; }
.text-xs { font-size: 0.75rem; line-height: 1rem; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }
.text-center { text-align: center; }
.fixed { position: fixed; }
.bottom-0 { bottom: 0; }
.left-0 { left: 0; }
.right-0 { right: 0; }
.grid { display: grid; }
.grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.aspect-square { aspect-ratio: 1 / 1; }
.transition { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
.hover\\:bg-gray-50:hover { background-color: #f9fafb; }
.hover\\:bg-green-700:hover { background-color: #15803d; }
.hover\\:bg-primary-500:hover { background-color: #0ea5e9; }
.hover\\:bg-primary-700:hover { background-color: #0369a1; }
.hover\\:bg-primary-900:hover { background-color: #0c4a6e; }
.hover\\:text-gray-700:hover { color: #374151; }
.hover\\:text-gray-900:hover { color: #111827; }
.hover\\:text-primary-500:hover { color: #0ea5e9; }
.hover\\:text-primary-600:hover { color: #0284c7; }
.focus\\:ring-primary-500:focus { --tw-ring-color: #0ea5e9; }
.focus\\:border-primary-500:focus { border-color: #0ea5e9; }
.focus\\:outline-none:focus { outline: 2px solid transparent; outline-offset: 2px; }
.focus\\:ring-2:focus { --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color); --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color); box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000); }
.focus\\:ring-offset-2:focus { --tw-ring-offset-width: 2px; }
`
      content = content.replace('@import "tailwindcss";', tailwindBase)
    }

    return new Response(content, {
      headers: {
        'Content-Type': 'text/css',
        'Cache-Control': process.env.NODE_ENV === 'production' ? 'public, max-age=0, must-revalidate' : 'no-cache',
      },
    })
  } catch (error) {
    return new Response('Not Found', { status: 404 })
  }
})

router.map(routes.home, home)
router.map(routes.auth, auth)
router.map(routes.dashboard, dashboard)
router.map(routes.events, events)
router.map(routes.attendance, attendance)
router.map(routes.admin, admin)
