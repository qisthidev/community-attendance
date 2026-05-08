# Community Attendance Web Application

A mobile-first web application for managing community attendance with 2-level organization structure. Built with Remix 3, Prisma, SQLite, and Tailwind CSS.

## Features

### Authentication & Authorization
- User registration and login
- Session management with HTTP-only cookies
- Role-based access control (admin, moderator, member)
- Protected routes

### Organization Management
- 2-level organization structure (Organization → Sub-organization)
- Support for multiple chapters/teams/divisions
- Member assignment to sub-organizations

### Event Management
- Create and manage events
- Event types: meetings, workshops, gatherings
- QR code generation for each event
- Event scheduling with start/end times

### Attendance Tracking
- Multiple check-in methods:
  - Manual check-in by admins
  - QR code scanning
  - Direct event check-in
- Attendance status tracking (present, absent, late, excused)
- Attendance history
- Personal attendance statistics

### Mobile-First UI
- Responsive design optimized for mobile devices
- Bottom navigation bar for easy thumb access
- Touch-friendly buttons (44x44px minimum)
- Clean card-based layouts
- Fast loading and minimal data usage

## Tech Stack

- **Framework**: Remix 3
- **Database**: SQLite with Prisma ORM
- **Styling**: Tailwind CSS
- **Validation**: Zod
- **Authentication**: bcryptjs
- **QR Codes**: qrcode library

## Project Structure

```
app/
├── controllers/      # Route handlers
│   ├── home.tsx     # Home page
│   ├── auth.tsx     # Authentication (login/register/logout)
│   ├── dashboard.tsx # Member dashboard
│   ├── events.tsx   # Events listing
│   ├── attendance.tsx # Attendance check-in
│   └── admin.tsx    # Admin panel
├── data/
│   └── db.ts        # Prisma client singleton
├── generated/
│   └── prisma/      # Generated Prisma client
├── routes.ts        # Route definitions
├── router.ts        # Route mappings
├── styles/
│   └── globals.css  # Global styles with Tailwind
├── ui/              # Shared UI components
│   ├── document.tsx # HTML document wrapper
│   └── layout.tsx   # Page layout wrapper
└── utils/
    ├── auth.ts      # Authentication utilities
    ├── render.tsx   # Response rendering
    └── validation.ts # Zod schemas

prisma/
├── schema.prisma    # Database schema
├── migrations/      # Database migrations
└── seed.ts          # Database seeding script
```

## Getting Started

### Prerequisites

- Node.js >=24.3.0 (enforced via .nvmrc)
- npm or compatible package manager

### Installation

```sh
# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Seed the database with test data
npx tsx prisma/seed.ts

# Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Test Credentials

After seeding the database, you can log in with:

- **Admin**: admin@example.com / admin123
- **Member 1**: member1@example.com / member123
- **Member 2**: member2@example.com / member123

## Database Schema

### Organization (Top Level)
- Community/group entity
- Contains multiple sub-organizations

### SubOrganization (Second Level)
- Chapters, teams, or divisions within an organization
- Members belong to sub-organizations

### User/Member
- User accounts with roles (admin, moderator, member)
- Assigned to sub-organizations
- Track attendance across events

### Event
- Meetings, workshops, gatherings
- Assigned to organizations and optionally sub-organizations
- Each event has a unique QR code for check-in

### Attendance
- Records of event attendance
- Multiple check-in methods tracked
- Status tracking (present, absent, late, excused)

## Commands

```sh
# Development
npm run dev          # Start development server
npm start            # Start production server

# Database
npx prisma migrate dev     # Run migrations
npx prisma generate        # Generate Prisma client
npx prisma studio          # Open Prisma Studio
npx tsx prisma/seed.ts     # Seed database

# Testing & Quality
npm test             # Run tests
npm run typecheck    # Type check with TypeScript
```

## Mobile-First Design Principles

1. **Touch-first interactions**: Large tap targets (min 44x44px)
2. **Thumb-friendly navigation**: Bottom navigation bar
3. **Fast loading**: Optimized for 3G networks
4. **Simple flows**: Maximum 3 taps to complete any action
5. **Clear feedback**: Visual confirmation of all actions
6. **Minimal data entry**: Use scanning, toggles, and selections over typing
7. **Progressive disclosure**: Show only essential info, expand on demand

## Roadmap

### Phase 1 (MVP) - ✅ Complete
- [x] Database schema and migrations
- [x] Authentication and authorization
- [x] Member dashboard with attendance history
- [x] Event management
- [x] QR code check-in
- [x] Admin panel

### Phase 2 - In Progress
- [ ] Real QR code scanner using device camera
- [ ] Enhanced error handling and loading states
- [ ] Mobile device testing and optimization

### Phase 3 - Planned
- [ ] PWA features (service worker, offline support)
- [ ] Notifications system
- [ ] Attendance reports and analytics
- [ ] Member directory
- [ ] Bulk operations

### Phase 4 - Future
- [ ] Multi-organization support per user
- [ ] Recurring events
- [ ] Email notifications
- [ ] Export to CSV/PDF
- [ ] Advanced analytics and visualizations

## Contributing

This is a community project. Contributions are welcome!

## License

See LICENSE file for details.
