import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { db } from '../data/db.ts'

const SALT_ROUNDS = 10
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000 // 30 days

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

export async function createSession(userId: string): Promise<string> {
  const token = generateToken()
  const expiresAt = new Date(Date.now() + SESSION_DURATION)

  await db.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  })

  return token
}

export async function getSessionUser(token: string | null) {
  if (!token) return null

  const session = await db.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          subOrganization: {
            include: {
              organization: true,
            },
          },
        },
      },
    },
  })

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await db.session.delete({ where: { id: session.id } })
    }
    return null
  }

  return session.user
}

export async function deleteSession(token: string): Promise<void> {
  await db.session.deleteMany({
    where: { token },
  })
}

export function getSessionToken(request: Request): string | null {
  const cookieHeader = request.headers.get('Cookie')
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(';').map(c => c.trim())
  const sessionCookie = cookies.find(c => c.startsWith('session='))

  return sessionCookie ? sessionCookie.split('=')[1] : null
}

export function setSessionCookie(token: string): string {
  return `session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DURATION / 1000}`
}

export function clearSessionCookie(): string {
  return 'session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
}
