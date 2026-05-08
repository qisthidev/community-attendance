import { createRouter } from 'remix/fetch-router'

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

router.map(routes.home, home)
router.map(routes.auth, auth)
router.map(routes.dashboard, dashboard)
router.map(routes.events, events)
router.map(routes.attendance, attendance)
router.map(routes.admin, admin)
