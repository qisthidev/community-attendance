import { createRouter } from 'remix/fetch-router'
import { readFile } from 'node:fs/promises'
import { basename, extname, join, relative, resolve, sep } from 'node:path'

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

// Serve pre-compiled CSS files from public/styles
router.get('/styles/*path', async ({ request }) => {
  const url = new URL(request.url)
  const pathname = decodeURIComponent(url.pathname.replace('/styles/', ''))
  const publicStylesDir = join(process.cwd(), 'public', 'styles')

  try {
    if (pathname.includes('\0')) {
      return new Response('Not Found', { status: 404 })
    }

    const fileName = basename(pathname)
    if (!fileName || extname(fileName).toLowerCase() !== '.css') {
      return new Response('Not Found', { status: 404 })
    }

    const cssPath = resolve(publicStylesDir, pathname)
    const relativePath = relative(publicStylesDir, cssPath)
    if (
      !relativePath ||
      relativePath === '..' ||
      relativePath.startsWith(`..${sep}`)
    ) {
      return new Response('Not Found', { status: 404 })
    }

    const content = await readFile(cssPath, 'utf-8')

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
