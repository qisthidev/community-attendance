import type { BuildAction } from 'remix/fetch-router'

import type { routes } from '../routes.ts'
import { db } from '../data/db.ts'
import { Layout } from '../ui/layout.tsx'
import { render } from '../utils/render.tsx'
import { getSessionToken, getSessionUser } from '../utils/auth.ts'

export const dashboard: BuildAction<'GET', typeof routes.dashboard> = {
  async handler({ request }) {
    const token = getSessionToken(request)
    const user = await getSessionUser(token)

    if (!user) {
      return new Response(null, {
        status: 302,
        headers: { Location: '/auth' },
      })
    }

    // Get upcoming events
    const upcomingEvents = await db.event.findMany({
      where: {
        startTime: {
          gte: new Date(),
        },
        ...(user.subOrganizationId
          ? {
              OR: [
                { subOrganizationId: user.subOrganizationId },
                { subOrganizationId: null },
              ],
            }
          : {}),
      },
      orderBy: {
        startTime: 'asc',
      },
      take: 5,
      include: {
        organization: true,
        subOrganization: true,
      },
    })

    // Get recent attendance
    const recentAttendance = await db.attendance.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        checkedAt: 'desc',
      },
      take: 10,
      include: {
        event: {
          include: {
            organization: true,
            subOrganization: true,
          },
        },
      },
    })

    // Get attendance stats
    const totalEvents = await db.attendance.count({
      where: {
        userId: user.id,
      },
    })

    const presentCount = await db.attendance.count({
      where: {
        userId: user.id,
        status: 'present',
      },
    })

    const attendanceRate = totalEvents > 0 ? Math.round((presentCount / totalEvents) * 100) : 0

    return render(
      <DashboardPage
        user={user}
        upcomingEvents={upcomingEvents}
        recentAttendance={recentAttendance}
        stats={{ totalEvents, presentCount, attendanceRate }}
      />,
      request
    )
  },
}

function DashboardPage() {
  return ({ user, upcomingEvents, recentAttendance, stats }: any) => (
    <Layout title="Dashboard">
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.name}</h1>
                <p className="text-sm text-gray-600">
                  {user.subOrganization?.name || 'No organization assigned'}
                </p>
              </div>
              <a
                href="/auth?action=logout"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </a>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-gray-900">{stats.totalEvents}</div>
              <div className="text-sm text-gray-600">Total Events</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-green-600">{stats.presentCount}</div>
              <div className="text-sm text-gray-600">Present</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-primary-600">{stats.attendanceRate}%</div>
              <div className="text-sm text-gray-600">Rate</div>
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h2>
          <div className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                No upcoming events
              </div>
            ) : (
              upcomingEvents.map((event: any) => (
                <div key={event.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{event.title}</h3>
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
                    </div>
                    <a
                      href={`/attendance?eventId=${event.id}`}
                      className="ml-4 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 touch-target"
                    >
                      Check In
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Attendance */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Attendance</h2>
          <div className="bg-white rounded-lg shadow divide-y">
            {recentAttendance.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No attendance records</div>
            ) : (
              recentAttendance.map((record: any) => (
                <div key={record.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{record.event.title}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(record.checkedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      record.status === 'present'
                        ? 'bg-green-100 text-green-800'
                        : record.status === 'late'
                        ? 'bg-yellow-100 text-yellow-800'
                        : record.status === 'excused'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {record.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-around py-3">
              <a
                href="/dashboard"
                className="flex flex-col items-center text-primary-600 touch-target"
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
