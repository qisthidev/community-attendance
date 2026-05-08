import type { BuildAction } from 'remix/fetch-router'
import QRCode from 'qrcode'
import { randomBytes } from 'crypto'

import type { routes } from '../routes.ts'
import { db } from '../data/db.ts'
import { Layout } from '../ui/layout.tsx'
import { render } from '../utils/render.tsx'
import { getSessionToken, getSessionUser } from '../utils/auth.ts'
import { eventSchema } from '../utils/validation.ts'

export const admin: BuildAction<'GET' | 'POST', typeof routes.admin> = {
  async handler({ request }) {
    const token = getSessionToken(request)
    const user = await getSessionUser(token)

    if (!user || user.role !== 'admin') {
      return new Response('Unauthorized', { status: 403 })
    }

    const url = new URL(request.url)
    const section = url.searchParams.get('section') || 'dashboard'

    if (request.method === 'POST') {
      return handleAdminAction(request, user)
    }

    if (section === 'create-event') {
      const organizations = await db.organization.findMany({
        include: {
          subOrganizations: true,
        },
      })
      return render(<CreateEventPage user={user} organizations={organizations} />, request)
    }

    if (section === 'events') {
      const events = await db.event.findMany({
        include: {
          organization: true,
          subOrganization: true,
          attendance: true,
        },
        orderBy: {
          startTime: 'desc',
        },
      })
      return render(<EventsManagementPage user={user} events={events} />, request)
    }

    if (section === 'members') {
      const members = await db.user.findMany({
        include: {
          subOrganization: {
            include: {
              organization: true,
            },
          },
          attendance: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
      return render(<MembersManagementPage user={user} members={members} />, request)
    }

    // Dashboard
    const stats = {
      totalMembers: await db.user.count(),
      totalEvents: await db.event.count(),
      upcomingEvents: await db.event.count({
        where: {
          startTime: {
            gte: new Date(),
          },
        },
      }),
      totalAttendance: await db.attendance.count(),
    }

    const recentEvents = await db.event.findMany({
      take: 5,
      orderBy: {
        startTime: 'desc',
      },
      include: {
        organization: true,
        subOrganization: true,
        attendance: true,
      },
    })

    return render(<AdminDashboardPage user={user} stats={stats} recentEvents={recentEvents} />, request)
  },
}

async function handleAdminAction(request: Request, user: any) {
  const formData = await request.formData()
  const data = Object.fromEntries(formData)

  if (data.action === 'create-event') {
    const result = eventSchema.safeParse({
      title: data.title,
      description: data.description || undefined,
      type: data.type,
      startTime: data.startTime,
      endTime: data.endTime,
      organizationId: data.organizationId,
      subOrganizationId: data.subOrganizationId || undefined,
      location: data.location || undefined,
    })

    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error.issues[0].message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Generate QR code
    const qrCodeData = `event-${randomBytes(16).toString('hex')}`

    const event = await db.event.create({
      data: {
        ...result.data,
        qrCode: qrCodeData,
      },
    })

    return new Response(null, {
      status: 302,
      headers: { Location: `/admin?section=events&eventId=${event.id}` },
    })
  }

  return new Response('Invalid action', { status: 400 })
}

function AdminDashboardPage() {
  return ({ user, stats, recentEvents }: any) => (
    <Layout title="Admin Dashboard">
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-gray-900">{stats.totalMembers}</div>
              <div className="text-sm text-gray-600">Total Members</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-primary-600">{stats.totalEvents}</div>
              <div className="text-sm text-gray-600">Total Events</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-green-600">{stats.upcomingEvents}</div>
              <div className="text-sm text-gray-600">Upcoming Events</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.totalAttendance}</div>
              <div className="text-sm text-gray-600">Total Check-ins</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <a
                href="/admin?section=create-event"
                className="bg-primary-600 text-white rounded-lg p-4 text-center font-medium hover:bg-primary-700 touch-target"
              >
                + Create Event
              </a>
              <a
                href="/admin?section=members"
                className="bg-white border-2 border-gray-300 text-gray-700 rounded-lg p-4 text-center font-medium hover:bg-gray-50 touch-target"
              >
                Manage Members
              </a>
            </div>
          </div>

          {/* Recent Events */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Recent Events</h2>
              <a href="/admin?section=events" className="text-sm text-primary-600 hover:text-primary-700">
                View All
              </a>
            </div>
            <div className="space-y-3">
              {recentEvents.map((event: any) => (
                <div key={event.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{event.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(event.startTime).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {event.attendance.length} attendees
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-around py-3">
              <a
                href="/dashboard"
                className="flex flex-col items-center text-gray-600 hover:text-primary-600 touch-target"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-xs mt-1">Home</span>
              </a>
              <a
                href="/events"
                className="flex flex-col items-center text-gray-600 hover:text-primary-600 touch-target"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs mt-1">Events</span>
              </a>
              <a
                href="/attendance?action=scan"
                className="flex flex-col items-center text-gray-600 hover:text-primary-600 touch-target"
              >
                <div className="w-12 h-12 -mt-6 bg-primary-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <span className="text-xs mt-1">Scan QR</span>
              </a>
              <a
                href="/admin"
                className="flex flex-col items-center text-primary-600 touch-target"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-xs mt-1">Admin</span>
              </a>
            </div>
          </div>
        </nav>
      </div>
    </Layout>
  )
}

function CreateEventPage() {
  return ({ user, organizations }: any) => (
    <Layout title="Create Event">
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center">
              <a href="/admin" className="mr-4 text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </a>
              <h1 className="text-xl font-bold text-gray-900">Create Event</h1>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          <form method="POST" action="/admin" className="bg-white rounded-lg shadow p-6 space-y-4">
            <input type="hidden" name="action" value="create-event" />

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Event Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Event Type *
              </label>
              <select
                id="type"
                name="type"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="meeting">Meeting</option>
                <option value="workshop">Workshop</option>
                <option value="gathering">Gathering</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  id="startTime"
                  name="startTime"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                  End Time *
                </label>
                <input
                  type="datetime-local"
                  id="endTime"
                  name="endTime"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label htmlFor="organizationId" className="block text-sm font-medium text-gray-700">
                Organization *
              </label>
              <select
                id="organizationId"
                name="organizationId"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select organization</option>
                {organizations.map((org: any) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 touch-target"
            >
              Create Event
            </button>
          </form>
        </div>
      </div>
    </Layout>
  )
}

function EventsManagementPage() {
  return ({ user, events }: any) => (
    <Layout title="Manage Events">
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-900">Manage Events</h1>
              <a
                href="/admin?section=create-event"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium"
              >
                + New
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6 space-y-3">
          {events.map((event: any) => (
            <div key={event.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{event.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(event.startTime).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {event.attendance.length} attendees
                  </p>
                </div>
                <div className="ml-4 text-xs text-gray-500 font-mono">
                  QR: {event.qrCode?.substring(0, 8)}...
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}

function MembersManagementPage() {
  return ({ user, members }: any) => (
    <Layout title="Manage Members">
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <h1 className="text-xl font-bold text-gray-900">Manage Members</h1>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6 space-y-3">
          {members.map((member: any) => (
            <div key={member.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{member.name}</h3>
                  <p className="text-sm text-gray-600">{member.email}</p>
                  {member.subOrganization && (
                    <p className="text-xs text-gray-500 mt-1">
                      {member.subOrganization.name}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {member.role}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {member.attendance.length} events
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
