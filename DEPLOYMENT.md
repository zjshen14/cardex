# Hybrid Deployment Strategy

This document outlines the hybrid deployment strategy for CardEx that allows:
- **Local Development**: SQLite database + local file storage (unchanged from original setup)
- **Production**: PostgreSQL database + Supabase Storage

## Architecture Overview

### Local Development Environment
- **Database**: SQLite with JSON strings for `imageUrls` field
- **Storage**: Local filesystem in `public/uploads/cards/`
- **Schema**: `prisma/schema.prisma` (SQLite provider)
- **Environment**: `NODE_ENV=development`

### Production Environment  
- **Database**: PostgreSQL with native arrays for `imageUrls` field
- **Storage**: Supabase Storage with cloud blob storage
- **Schema**: `prisma/schema.production.prisma` (PostgreSQL provider)
- **Environment**: `NODE_ENV=production` + Supabase environment variables

## Environment Detection

The system automatically detects environment using:
```javascript
const isProduction = process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SUPABASE_URL
```

## Database Configuration

### Local Development (SQLite)
```prisma
// prisma/schema.prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Card {
  imageUrls String // JSON string for SQLite
  // ...
}
```

### Production (PostgreSQL)
```prisma
// prisma/schema.production.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Card {
  imageUrls String[] // Native array for PostgreSQL
  // ...
}
```

## Storage System

### Hybrid Upload API (`src/app/api/upload/route.ts`)
- **Development**: Uses Node.js `fs` to save files to `public/uploads/cards/`
- **Production**: Uses Supabase Storage API with dynamic imports

### Hybrid Image Cleanup (`src/lib/imageCleanup.ts`)
- **Development**: Uses Node.js `fs.unlink()` to delete local files
- **Production**: Uses Supabase Storage deletion API

### Client-Side Image URL Parsing (`src/lib/imageUtils.ts`)
- `parseImageUrls()`: Handles both JSON strings (SQLite) and native arrays (PostgreSQL)
- `serializeImageUrls()`: Converts between formats as needed

## Environment Variables

### Local Development (`.env.local`)
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"
NODE_ENV="development"
```

### Production (Supabase)
```env
DATABASE_URL="postgresql://username:password@hostname:port/database"
NEXTAUTH_URL="https://your-app.supabase.co"  
NEXTAUTH_SECRET="your-production-secret"
NODE_ENV="production"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

## Build Commands

### Local Development
```bash
npm run dev          # Development server with SQLite
npm run build        # Build for development (SQLite)
npm run db:generate  # Generate Prisma client for SQLite
```

### Production Deployment
```bash
npm run build:prod     # Build with PostgreSQL schema  
npm run db:generate:prod # Generate client for PostgreSQL
npm run db:migrate:prod  # Deploy migrations to production DB
```

## Deployment Steps

### 1. Set Up Supabase Project
1. Create new Supabase project at https://supabase.com
2. Create PostgreSQL database
3. Create storage bucket named `card-images`
4. Set up storage policies for public access
5. Get project URL and anon key

### 2. Configure Production Environment
1. Set all production environment variables
2. Run database migrations: `npm run db:migrate:prod`
3. Generate production Prisma client: `npm run db:generate:prod`

### 3. Deploy Application
1. Use Supabase hosting or deploy to Vercel/Netlify
2. Set production environment variables in hosting platform
3. Build with production schema: `npm run build:prod`

## Data Migration (Optional)

To migrate existing SQLite data to PostgreSQL:

1. Export existing data from SQLite
2. Transform `imageUrls` JSON strings to PostgreSQL arrays
3. Import data to production PostgreSQL database

## Testing Strategy

### Local Development Testing
- All existing functionality works unchanged
- File uploads save to `public/uploads/cards/`
- Database uses SQLite with JSON imageUrls

### Production Testing
- Set `NODE_ENV=production` and Supabase variables locally
- Test with production schema: `npm run build:prod`
- Verify Supabase storage integration
- Test PostgreSQL array handling

## Key Files Modified

- `src/app/api/upload/route.ts` - Hybrid upload logic
- `src/lib/imageCleanup.ts` - Hybrid cleanup logic  
- `src/lib/imageUtils.ts` - Cross-environment utilities
- `prisma/schema.production.prisma` - Production database schema
- `package.json` - Production build scripts
- `.env.example` - Environment variable templates

## Benefits

1. **Zero Breaking Changes**: Local development continues to work exactly as before
2. **Gradual Migration**: Can test production features locally by setting environment variables
3. **Cloud Benefits**: Production gets managed PostgreSQL + blob storage + hosting
4. **Cost Effective**: Free Supabase tier supports the application requirements
5. **GitHub Integration**: Supabase supports automatic deployments from GitHub