# CardEx - Collectible Card Marketplace

A modern web application for buying and selling collectible cards built with Next.js 15, TypeScript, and a hybrid database architecture.

🌐 **Live Demo**: [https://cardex-omega.vercel.app](https://cardex-omega.vercel.app)

## Features

- 🃏 Browse and search collectible cards by category
- 📸 Upload multiple card images with drag & drop interface
- 💰 Create and manage card listings with detailed information
- 🔐 Secure user authentication and profiles with contact preferences
- 📧 Contact seller system with privacy controls
- 📱 Fully responsive design for all devices
- 🎯 Filter by categories, condition, and price ranges
- ⚡ Hybrid architecture supporting local development and cloud production

## Tech Stack

- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **Database**: SQLite (development) / PostgreSQL (production) with Prisma ORM
- **Authentication**: NextAuth.js v4 with custom pages
- **File Storage**: Local filesystem (dev) / Supabase Storage (production)
- **Hosting**: Vercel + Supabase
- **Testing**: Jest with React Testing Library (220+ tests)
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/zjshen14/cardex.git
cd cardex
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables** in `.env`:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-dev-secret-key-here"
```

4. **Set up the database**
```bash
npm run db:generate
npm run db:migrate:dev
```

5. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production (development database)  
- `npm run build:prod` - Build for production (PostgreSQL database)
- `npm run test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run db:migrate:dev` - Run database migrations (development)
- `npm run db:generate` - Generate Prisma client

## Architecture

### Hybrid Database System
- **Development**: SQLite with JSON string arrays for easy local setup
- **Production**: PostgreSQL with native arrays via Supabase
- **Migration**: Dual Prisma schemas handle environment differences automatically

### Database Models
- **Users**: Authentication, profiles, and contact preferences
- **Cards**: Listings with multiple images, condition, pricing, and metadata  
- **Transactions**: Purchase tracking and order management
- **Watchlist**: User favorites with duplicate prevention

### File Storage
- **Development**: Local filesystem (`public/uploads/cards/`)
- **Production**: Supabase Storage with CDN optimization
- **Security**: Authentication required, automatic cleanup on deletion

## Project Structure

```
src/
├── app/                 # Next.js 15 App Router pages and API routes
│   ├── api/            # REST API endpoints
│   ├── auth/           # Authentication pages
│   └── cards/          # Card browsing and detail pages
├── components/          # Reusable React components
├── lib/                # Utilities (Prisma, auth, storage)
├── __tests__/          # Comprehensive test suite (220+ tests)
└── types/              # TypeScript type definitions
prisma/
├── schema.prisma           # SQLite schema (development)
└── schema.production.prisma # PostgreSQL schema (production)
```

## Deployment

The application is deployed at **[cardex-omega.vercel.app](https://cardex-omega.vercel.app)** using:

- **Frontend**: Vercel (auto-deploy from GitHub)
- **Database**: Supabase PostgreSQL 
- **Storage**: Supabase Storage (`card-images` bucket)
- **Domain**: Vercel subdomain with custom configuration

For deployment details, see [CLAUDE.md](./CLAUDE.md).

## Testing

Run the comprehensive test suite:
```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

The project includes 220+ tests covering:
- API endpoints with mocked database operations
- React components with user interactions  
- File upload and validation logic
- Authentication flows and edge cases
- Cross-environment compatibility

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and add tests
4. Ensure all tests pass (`npm run lint && npm run test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
