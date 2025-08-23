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

# IMPORTANT: Always run complete CI pipeline before committing
npm run ci   # Full CI check (must pass before git commit)
```

## Architecture Overview

CardEx is a Next.js 15 collectible card marketplace built with the App Router architecture. The application uses a multi-environment database setup with separate schemas for development and production.

### Core Technology Stack
- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **Database**: SQLite (development) / PostgreSQL (production) with Prisma ORM
- **Authentication**: NextAuth.v4 with credentials provider and bcrypt password hashing
- **File Storage**: Local filesystem (dev) / Supabase Storage (production)
- **Hosting**: Vercel for frontend, Supabase for backend services
- **Testing**: Jest with React Testing Library and jsdom environment

### Multi-Environment Database Architecture
The project uses two separate Prisma schemas:
- `prisma/schema.prisma` - SQLite for development with JSON strings for arrays
- `prisma/schema.production.prisma` - PostgreSQL for production with native arrays

Key difference: Card `imageUrls` field is `String` (JSON) in dev, `String[]` in production.

### Database Models
- **User**: Authentication with email/password, includes optional username field
- **Card**: Listings with condition enums, pricing, categories, seller relationships, and image URLs
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
- **Components**: Reusable UI components in `src/components/` including:
  - `CardGrid`, `CardItem`: Card display and listing components
  - `EditListingDialog`: Modal for editing listings with image management
  - `ViewListingModal`: Modal for viewing listing details with image gallery
  - `ConfirmDialog`, `LoadingModal`: Utility dialogs for user interactions
  - `Navbar`, `Hero`: Layout and navigation components

### API Structure
RESTful API routes following Next.js App Router conventions:

#### Authentication APIs
- NextAuth configuration in `src/app/api/auth/[...nextauth]/route.ts`
- User registration in `src/app/api/auth/register/route.ts`

#### Card Management APIs
- `GET/POST /api/cards` - List all cards, create new listings
- `GET/PUT/DELETE /api/cards/[id]` - Get, update, or delete specific cards
- `GET /api/listings` - Get user's own card listings

#### File Upload APIs
- `POST /api/upload` - Upload card images with validation
  - Supports multiple files (max 5)
  - File type validation (JPG, PNG, GIF, WebP)
  - Size limit: 10MB per file
  - Returns array of uploaded file URLs

### Utility Libraries
- **Image Cleanup**: `src/lib/imageCleanup.ts` - Safe file deletion with error handling
- **Authentication**: `src/lib/auth.ts` - NextAuth configuration and session management
- **Database**: `src/lib/prisma.ts` - Prisma client configuration

### Environment Configuration

#### Development (.env)
```bash
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"  
NEXTAUTH_SECRET="your-dev-secret"
```

#### Production (Vercel Environment Variables)
```bash
DATABASE_URL="postgresql://postgres.PROJECT_ID:PASSWORD@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
NEXTAUTH_URL="https://cardex-omega.vercel.app"
NEXTAUTH_SECRET="your-production-secret" 
NODE_ENV="production"
NEXT_PUBLIC_SUPABASE_URL="https://PROJECT_ID.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

### File Storage Configuration

#### Development
- **Upload Directory**: `public/uploads/cards/` (auto-created)
- **Ignored in Git**: Added to `.gitignore` to prevent committing uploads
- **Permissions**: Ensure write access to `public/uploads/` directory

#### Production (Supabase Storage)
- **Bucket Name**: `card-images` (defined in `src/lib/supabase.ts`)
- **Access**: Public bucket with RLS policies
- **Image Optimization**: Configured in `next.config.ts` for Supabase domain
- **Security Note**: RLS currently disabled (Issue #13) - needs proper policies before production launch

## Image Upload & Management System

### Image Upload Features
- **Drag & Drop Interface**: Modern file upload with visual feedback
- **Multiple File Support**: Upload up to 5 images per listing
- **Image Previews**: Real-time preview generation before upload
- **File Validation**: Client and server-side validation for security
- **Progress Feedback**: Loading states and error handling

### Storage Architecture

#### Development (Local Filesystem)
- **Local Filesystem**: Images stored in `public/uploads/cards/`
- **Unique Filenames**: Generated with timestamp and random ID
- **Organized Structure**: Separate directory for card images
- **URL Generation**: Public URLs like `/uploads/cards/filename.jpg`

#### Production (Supabase Storage)
- **Cloud Storage**: Images stored in Supabase `card-images` bucket
- **Unique Filenames**: Generated with timestamp and random ID 
- **CDN URLs**: Optimized URLs via Supabase CDN
- **URL Format**: `https://PROJECT_ID.supabase.co/storage/v1/object/public/card-images/filename.webp`

### Image Management in Edit Dialog
- **Existing Image Display**: Shows current images with delete options
- **Add New Images**: Upload additional images via drag & drop
- **Remove Images**: Individual delete buttons for each image
- **Mixed Operations**: Add and remove images in single edit session

### Automatic Image Cleanup
- **Utility Function**: `src/lib/imageCleanup.ts` handles file deletion
- **Hybrid Support**: Automatically detects environment and uses appropriate cleanup (local files vs Supabase)
- **Delete Triggers**: Runs when listings are deleted or images removed
- **Error Resilience**: Continues cleanup even if individual files fail
- **Security**: Only processes authorized URLs (local `/uploads/cards/` or Supabase storage URLs)

### File Validation Rules
- **Supported Types**: JPG, PNG, GIF, WebP
- **Size Limits**: 10MB maximum per file
- **Count Limits**: Maximum 5 images per listing
- **Path Validation**: Only local upload paths processed

## Production Deployment

### Live Application
- **URL**: https://cardex-omega.vercel.app
- **Status**: Fully operational marketplace
- **Database**: PostgreSQL via Supabase (schema created manually)
- **Storage**: Supabase Storage with `card-images` bucket
- **Authentication**: NextAuth configured for production domain

### Deployment Architecture
- **Frontend**: Vercel (automated deployments from GitHub main branch)
- **Database**: Supabase PostgreSQL (managed service)
- **Storage**: Supabase Storage (managed service)
- **CI/CD**: GitHub Actions → Vercel integration
- **Domain**: cardex-omega.vercel.app (Vercel subdomain)

### Key Production Differences
- **Database Schema**: Uses native PostgreSQL arrays (`String[]`) for `imageUrls` field
- **Image URLs**: Supabase CDN URLs instead of local `/uploads/` paths
- **Dependencies**: TypeScript and Tailwind moved to production dependencies for Vercel builds
- **Next.js Config**: Supabase domain added to `remotePatterns` for image optimization
- **Environment Variables**: All configured in Vercel dashboard
- **Authentication**: Session management works across Vercel edge functions

### Known Issues
- **Issue #13**: RLS policies disabled on `storage.objects` table (security risk - needs fixing)
- **Connection String**: Uses pgbouncer with connection_limit=1 to avoid prepared statement conflicts

### Testing & Quality Assurance
- **CI Status**: All 220+ tests passing
- **ESLint**: 0 warnings in production
- **Type Safety**: Full TypeScript coverage with hybrid type handling
- **Performance**: Image optimization enabled, CDN delivery
- **Security**: Authentication required for all protected routes and uploads

## Testing Setup
Jest configuration with:
- Next.js integration via `next/jest`
- jsdom environment for React component testing
- Setup file at `jest.setup.js`
- **Comprehensive Coverage**: 220+ tests covering:
  - API endpoints with mocked Prisma operations
  - React components with user interactions
  - Image upload and validation logic
  - File cleanup and error handling
  - Authentication flows and edge cases
  - Hybrid environment compatibility