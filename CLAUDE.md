# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Development Server
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production (development database)
npm run build:prod   # Build for production (PostgreSQL database)
npm start           # Start production server
```

### Database Operations
```bash
# Development (SQLite)
npm run db:migrate:dev    # Run migrations for development
npm run db:generate       # Generate Prisma client

# Production (PostgreSQL)
npm run db:migrate:prod   # Deploy migrations to production
npm run db:generate:prod  # Generate client for production schema
```

### Testing & Quality
```bash
npm run test             # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
npm run lint            # Run ESLint
```

## Architecture Overview

CardEx is a Next.js 15 collectible card marketplace built with the App Router architecture. The application uses a multi-environment database setup with separate schemas for development and production.

### Core Technology Stack
- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **Database**: SQLite (development) / PostgreSQL (production) with Prisma ORM
- **Authentication**: NextAuth.v4 with credentials provider and bcrypt password hashing
- **Testing**: Jest with React Testing Library and jsdom environment

### Multi-Environment Database Architecture
The project uses two separate Prisma schemas:
- `prisma/schema.prisma` - SQLite for development with JSON strings for arrays
- `prisma/schema.production.prisma` - PostgreSQL for production with native arrays

Key difference: Card `imageUrls` field is `String` (JSON) in dev, `String[]` in production.

### Database Models
- **User**: Authentication with email/password, includes optional username field
- **Card**: Listings with condition enums, pricing, categories, and seller relationships
- **Transaction**: Purchase tracking with buyer/seller relationships and status enum
- **Watchlist**: User favorites with unique constraints preventing duplicates

### Authentication System
Uses NextAuth.v4 with:
- Credentials provider with bcrypt password hashing
- JWT strategy with custom session callbacks
- Prisma adapter integration
- Custom pages at `/auth/signin` and `/auth/signup`

### Component Architecture
- **Providers**: NextAuth session provider wrapper in `src/components/Providers.tsx`
- **Layout**: Global layout with Navbar and Geist fonts in `src/app/layout.tsx`
- **Components**: Reusable UI components in `src/components/` (CardGrid, CardItem, Hero, Navbar)

### API Structure
RESTful API routes following Next.js App Router conventions:
- Authentication endpoints in `src/app/api/auth/`
- NextAuth configuration in `[...nextauth]/route.ts`
- User registration in `register/route.ts`

### Environment Configuration
Requires `.env.local` with:
- `DATABASE_URL` (different formats for dev vs prod)
- `NEXTAUTH_URL` 
- `NEXTAUTH_SECRET`

### Testing Setup
Jest configuration with:
- Next.js integration via `next/jest`
- jsdom environment for React component testing
- Setup file at `jest.setup.js`
- Tests located in `src/__tests__/` with API and component coverage