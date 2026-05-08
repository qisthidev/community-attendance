import type { BuildAction } from 'remix/fetch-router'

import type { routes } from '../routes.ts'
import { db } from '../data/db.ts'
import { Layout } from '../ui/layout.tsx'
import { render } from '../utils/render.tsx'
import { getSessionToken, getSessionUser } from '../utils/auth.ts'

export const events: BuildAction<'GET', typeof routes.events> = {
  async handler({ request }) {
    const token = getSessionToken(request)
    const user = await getSessionUser(token)

    if (!user) {
      return new Response(null, {
        status: 302,
        headers: { Location: '/auth' },
      })
    }

    const url = new URL(request.url)
    const view = url.searchParams.get('view') || 'upcoming'

    let eventsQuery: any = {
      include: {
        organization: true,
        subOrganization: true,
        attendance: {
          where: {
            userId: user.id,
          },
        },
      },
      orderBy: {
        startTime: view === 'past' ? 'desc' : 'asc',
      },
    }

    if (view === 'upcoming') {
      eventsQuery.where = {
        startTime: {
          gte: new Date(),
        },
      }
    } else if (view === 'past') {
      eventsQuery.where = {
        startTime: {
          lt: new Date(),
        },
      }
    }

    // Filter by sub-organization if user belongs to one
    if (user.subOrganizationId) {
      eventsQuery.where = {
        ...eventsQuery.where,
        OR: [
          { subOrganizationId: user.subOrganizationId },
          { subOrganizationId: null },
        ],
      }
    }

    const eventsList = await db.event.findMany(eventsQuery)

    return render(<EventsPage user={user} events={eventsList} view={view} />, request)
  },
}

function EventsPage() {
  return ({ user, events, view }: any) => (
    <Layout title="Events">
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <h1 className="text-xl font-bold text-gray-900">Events</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex space-x-8">
              <a
                href="/events?view=upcoming"
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  view === 'upcoming'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Upcoming
              </a>
              <a
                href="/events?view=past"
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  view === 'past'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Past
              </a>
              <a
                href="/events?view=all"
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  view === 'all'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                All
              </a>
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="space-y-4">
            {events.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                No events found
              </div>
            ) : (
              events.map((event: any) => {
                const hasAttended = event.attendance && event.attendance.length > 0
                const isPast = new Date(event.endTime) < new Date()

                return (
                  <div key={event.id} className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{event.title}</h3>
                          {hasAttended && (
                            <span className="text-green-600">✓</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(event.startTime).toLocaleString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </p>
                        {event.location && (
                          <p className="text-sm text-gray-500 mt-1">📍 {event.location}</p>
                        )}
                        {event.subOrganization && (
                          <p className="text-xs text-gray-500 mt-1">
                            {event.subOrganization.name}
                          </p>
                        )}
                      </div>
                      {!isPast && !hasAttended && (
                        <a
                          href={`/attendance?action=checkin&eventId=${event.id}`}
                          className="ml-4 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 touch-target"
                        >
                          Check In
                        </a>
                      )}
                      {hasAttended && (
                        <span className="ml-4 px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                          Attended
                        </span>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-sm text-gray-700 mt-3">{event.description}</p>
                    )}
                  </div>
                )
              })
            )}
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
                className="flex flex-col items-center text-primary-600 touch-target"
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
              {user.role === 'admin' && (
                <a
                  href="/admin"
                  className="flex flex-col items-center text-gray-600 hover:text-primary-600 touch-target"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-xs mt-1">Admin</span>
                </a>
              )}
            </div>
          </div>
        </nav>
      </div>
    </Layout>
  )
}
