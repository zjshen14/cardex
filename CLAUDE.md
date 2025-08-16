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
- **File Storage**: Local filesystem storage in `public/uploads/cards/`
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
Requires `.env.local` with:
- `DATABASE_URL` (different formats for dev vs prod)
- `NEXTAUTH_URL` 
- `NEXTAUTH_SECRET`

### File Storage Configuration
- **Upload Directory**: `public/uploads/cards/` (auto-created)
- **Ignored in Git**: Added to `.gitignore` to prevent committing uploads
- **Permissions**: Ensure write access to `public/uploads/` directory

## Image Upload & Management System

### Image Upload Features
- **Drag & Drop Interface**: Modern file upload with visual feedback
- **Multiple File Support**: Upload up to 5 images per listing
- **Image Previews**: Real-time preview generation before upload
- **File Validation**: Client and server-side validation for security
- **Progress Feedback**: Loading states and error handling

### Storage Architecture
- **Local Filesystem**: Images stored in `public/uploads/cards/`
- **Unique Filenames**: Generated with timestamp and random ID
- **Organized Structure**: Separate directory for card images
- **URL Generation**: Public URLs like `/uploads/cards/filename.jpg`

### Image Management in Edit Dialog
- **Existing Image Display**: Shows current images with delete options
- **Add New Images**: Upload additional images via drag & drop
- **Remove Images**: Individual delete buttons for each image
- **Mixed Operations**: Add and remove images in single edit session

### Automatic Image Cleanup
- **Utility Function**: `src/lib/imageCleanup.ts` handles file deletion
- **Delete Triggers**: Runs when listings are deleted or images removed
- **Error Resilience**: Continues cleanup even if individual files fail
- **Security**: Only processes local `/uploads/cards/` URLs

### File Validation Rules
- **Supported Types**: JPG, PNG, GIF, WebP
- **Size Limits**: 10MB maximum per file
- **Count Limits**: Maximum 5 images per listing
- **Path Validation**: Only local upload paths processed

## Testing Setup
Jest configuration with:
- Next.js integration via `next/jest`
- jsdom environment for React component testing
- Setup file at `jest.setup.js`
- **Comprehensive Coverage**: 164+ tests covering:
  - API endpoints with mocked Prisma operations
  - React components with user interactions
  - Image upload and validation logic
  - File cleanup and error handling
  - Authentication flows and edge cases