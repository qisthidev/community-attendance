import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  subOrganizationId: z.string().optional(),
})

export const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  type: z.enum(['meeting', 'workshop', 'gathering']),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  organizationId: z.string(),
  subOrganizationId: z.string().optional(),
  location: z.string().optional(),
})

export const attendanceSchema = z.object({
  userId: z.string(),
  eventId: z.string(),
  status: z.enum(['present', 'absent', 'late', 'excused']),
  method: z.enum(['manual', 'qr', 'geolocation']).default('manual'),
  notes: z.string().optional(),
})

export const organizationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
})

export const subOrganizationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  organizationId: z.string(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type EventInput = z.infer<typeof eventSchema>
export type AttendanceInput = z.infer<typeof attendanceSchema>
export type OrganizationInput = z.infer<typeof organizationSchema>
export type SubOrganizationInput = z.infer<typeof subOrganizationSchema>
