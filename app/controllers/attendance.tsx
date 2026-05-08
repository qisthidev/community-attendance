import type { BuildAction } from 'remix/fetch-router'
import QRCode from 'qrcode'

import type { routes } from '../routes.ts'
import { db } from '../data/db.ts'
import { Layout } from '../ui/layout.tsx'
import { render } from '../utils/render.tsx'
import { getSessionToken, getSessionUser } from '../utils/auth.ts'
import { attendanceSchema } from '../utils/validation.ts'

export const attendance: BuildAction<'GET' | 'POST', typeof routes.attendance> = {
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
    const action = url.searchParams.get('action') || 'list'
    const eventId = url.searchParams.get('eventId')

    if (request.method === 'POST') {
      return handleAttendanceAction(request, user)
    }

    if (action === 'scan') {
      return render(<QRScannerPage user={user} />, request)
    }

    if (action === 'checkin' && eventId) {
      const event = await db.event.findUnique({
        where: { id: eventId },
        include: {
          organization: true,
          subOrganization: true,
        },
      })

      if (!event) {
        return new Response('Event not found', { status: 404 })
      }

      return render(<CheckInPage user={user} event={event} />, request)
    }

    // List all attendance
    const attendanceRecords = await db.attendance.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        checkedAt: 'desc',
      },
      include: {
        event: {
          include: {
            organization: true,
            subOrganization: true,
          },
        },
      },
    })

    return render(<AttendanceListPage user={user} records={attendanceRecords} />, request)
  },
}

async function handleAttendanceAction(request: Request, user: any) {
  const formData = await request.formData()
  const data = Object.fromEntries(formData)

  // Manual check-in
  if (data.action === 'checkin') {
    const result = attendanceSchema.safeParse({
      userId: user.id,
      eventId: data.eventId,
      status: data.status || 'present',
      method: data.method || 'manual',
      notes: data.notes || undefined,
    })

    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error.issues[0].message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Check if already checked in
    const existing = await db.attendance.findUnique({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId: result.data.eventId,
        },
      },
    })

    if (existing) {
      return new Response(JSON.stringify({ error: 'Already checked in to this event' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const attendance = await db.attendance.create({
      data: result.data,
    })

    return new Response(null, {
      status: 302,
      headers: { Location: '/dashboard' },
    })
  }

  // QR code check-in
  if (data.action === 'qr-checkin') {
    const qrCode = data.qrCode as string

    const event = await db.event.findUnique({
      where: { qrCode },
    })

    if (!event) {
      return new Response(JSON.stringify({ error: 'Invalid QR code' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Check if event is happening now (within 2 hours before and 1 hour after)
    const now = new Date()
    const eventStart = new Date(event.startTime)
    const eventEnd = new Date(event.endTime)
    const twoHoursBefore = new Date(eventStart.getTime() - 2 * 60 * 60 * 1000)
    const oneHourAfter = new Date(eventEnd.getTime() + 60 * 60 * 1000)

    if (now < twoHoursBefore || now > oneHourAfter) {
      return new Response(JSON.stringify({ error: 'Event check-in window has closed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Check if already checked in
    const existing = await db.attendance.findUnique({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId: event.id,
        },
      },
    })

    if (existing) {
      return new Response(JSON.stringify({ error: 'Already checked in to this event' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const attendance = await db.attendance.create({
      data: {
        userId: user.id,
        eventId: event.id,
        status: 'present',
        method: 'qr',
      },
    })

    return new Response(null, {
      status: 302,
      headers: { Location: '/dashboard' },
    })
  }

  return new Response('Invalid action', { status: 400 })
}

function QRScannerPage() {
  return ({ user }: any) => (
    <Layout title="Scan QR Code">
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center">
              <a href="/dashboard" className="mr-4 text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </a>
              <h1 className="text-xl font-bold text-gray-900">Scan QR Code</h1>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <div className="text-center">
                <svg className="w-32 h-32 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <p className="text-gray-600">QR Scanner</p>
                <p className="text-sm text-gray-500 mt-2">Camera access required</p>
              </div>
            </div>

            <form method="POST" action="/attendance" className="space-y-4">
              <input type="hidden" name="action" value="qr-checkin" />
              <div>
                <label htmlFor="qrCode" className="block text-sm font-medium text-gray-700">
                  Or enter QR code manually:
                </label>
                <input
                  type="text"
                  id="qrCode"
                  name="qrCode"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter QR code"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 px-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 touch-target"
              >
                Check In
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  )
}

function CheckInPage() {
  return ({ user, event }: any) => (
    <Layout title="Check In">
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center">
              <a href="/dashboard" className="mr-4 text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </a>
              <h1 className="text-xl font-bold text-gray-900">Check In</h1>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h2>
            <p className="text-gray-600 mb-4">
              {new Date(event.startTime).toLocaleString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </p>
            {event.location && (
              <p className="text-gray-600 mb-4">📍 {event.location}</p>
            )}
            {event.description && (
              <p className="text-gray-700 mb-6">{event.description}</p>
            )}

            <form method="POST" action="/attendance" className="space-y-4">
              <input type="hidden" name="action" value="checkin" />
              <input type="hidden" name="eventId" value={event.id} />
              <input type="hidden" name="status" value="present" />
              <input type="hidden" name="method" value="manual" />

              <button
                type="submit"
                className="w-full py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 touch-target"
              >
                ✓ Check In Now
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  )
}

function AttendanceListPage() {
  return ({ user, records }: any) => (
    <Layout title="Attendance History">
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <h1 className="text-xl font-bold text-gray-900">Attendance History</h1>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-white rounded-lg shadow divide-y">
            {records.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No attendance records</div>
            ) : (
              records.map((record: any) => (
                <div key={record.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{record.event.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(record.checkedAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Via {record.method}
                      </p>
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
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
