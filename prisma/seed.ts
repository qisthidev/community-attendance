import 'dotenv/config'
import { PrismaClient } from '../app/generated/prisma/client.ts'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import bcrypt from 'bcryptjs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dbPath = join(__dirname, '..', 'dev.db')

const adapter = new PrismaLibSql({
  url: `file:${dbPath}`,
})

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // Create organizations
  const org1 = await prisma.organization.upsert({
    where: { slug: 'community-central' },
    update: {},
    create: {
      name: 'Community Central',
      slug: 'community-central',
    },
  })

  console.log('✓ Created organization:', org1.name)

  // Create sub-organizations
  const subOrg1 = await prisma.subOrganization.upsert({
    where: {
      organizationId_slug: {
        organizationId: org1.id,
        slug: 'chapter-north',
      },
    },
    update: {},
    create: {
      name: 'Chapter North',
      slug: 'chapter-north',
      organizationId: org1.id,
    },
  })

  const subOrg2 = await prisma.subOrganization.upsert({
    where: {
      organizationId_slug: {
        organizationId: org1.id,
        slug: 'chapter-south',
      },
    },
    update: {},
    create: {
      name: 'Chapter South',
      slug: 'chapter-south',
      organizationId: org1.id,
    },
  })

  console.log('✓ Created sub-organizations:', subOrg1.name, subOrg2.name)

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      passwordHash: adminPassword,
      role: 'admin',
      subOrganizationId: subOrg1.id,
    },
  })

  console.log('✓ Created admin user:', admin.email)

  // Create member users
  const memberPassword = await bcrypt.hash('member123', 10)
  const member1 = await prisma.user.upsert({
    where: { email: 'member1@example.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'member1@example.com',
      passwordHash: memberPassword,
      role: 'member',
      subOrganizationId: subOrg1.id,
    },
  })

  const member2 = await prisma.user.upsert({
    where: { email: 'member2@example.com' },
    update: {},
    create: {
      name: 'Jane Smith',
      email: 'member2@example.com',
      passwordHash: memberPassword,
      role: 'member',
      subOrganizationId: subOrg2.id,
    },
  })

  console.log('✓ Created member users:', member1.email, member2.email)

  // Create events
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const event1 = await prisma.event.create({
    data: {
      title: 'Weekly Community Meetup',
      description: 'Join us for our weekly community gathering and networking session.',
      type: 'meeting',
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000),
      organizationId: org1.id,
      subOrganizationId: subOrg1.id,
      qrCode: 'event-qr-001',
      location: 'Community Center Hall A',
    },
  })

  const event2 = await prisma.event.create({
    data: {
      title: 'Tech Workshop: Web Development',
      description: 'Learn modern web development techniques and best practices.',
      type: 'workshop',
      startTime: nextWeek,
      endTime: new Date(nextWeek.getTime() + 4 * 60 * 60 * 1000),
      organizationId: org1.id,
      qrCode: 'event-qr-002',
      location: 'Tech Hub Room 302',
    },
  })

  const event3 = await prisma.event.create({
    data: {
      title: 'Community Social Gathering',
      description: 'Past event - social gathering for all members.',
      type: 'gathering',
      startTime: lastWeek,
      endTime: new Date(lastWeek.getTime() + 3 * 60 * 60 * 1000),
      organizationId: org1.id,
      qrCode: 'event-qr-003',
      location: 'Park Pavilion',
    },
  })

  console.log('✓ Created events:', event1.title, event2.title, event3.title)

  // Create attendance records for past event
  await prisma.attendance.create({
    data: {
      userId: member1.id,
      eventId: event3.id,
      status: 'present',
      method: 'qr',
    },
  })

  await prisma.attendance.create({
    data: {
      userId: member2.id,
      eventId: event3.id,
      status: 'present',
      method: 'manual',
    },
  })

  await prisma.attendance.create({
    data: {
      userId: admin.id,
      eventId: event3.id,
      status: 'present',
      method: 'manual',
    },
  })

  console.log('✓ Created attendance records')

  console.log('\n🎉 Seeding completed successfully!')
  console.log('\n📝 Test credentials:')
  console.log('Admin: admin@example.com / admin123')
  console.log('Member 1: member1@example.com / member123')
  console.log('Member 2: member2@example.com / member123')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
