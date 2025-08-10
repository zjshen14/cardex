# CardEx - Collectible Card Marketplace

A modern web application for buying and selling collectible cards built with Next.js 14, TypeScript, and PostgreSQL.

## Features

- 🃏 Browse and search collectible cards
- 💰 Buy and sell cards with secure transactions
- 🔐 User authentication and profiles
- ❤️ Wishlist functionality
- 📱 Responsive design
- 🎯 Filter by categories, condition, and price

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Icons**: Lucide React
- **Deployment**: Vercel ready

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. Install dependencies
```bash
npm install
```

2. Set up environment variables in `.env.local`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/cardex?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

3. Set up the database
```bash
npx prisma generate
npx prisma db push
```

4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application includes models for:
- **Users**: Authentication and profile data
- **Cards**: Card listings with images, condition, pricing
- **Transactions**: Purchase history and order management
- **Watchlist**: User's favorite cards

## Project Structure

```
src/
├── app/                 # Next.js 14 App Router
├── components/          # Reusable React components
├── lib/                # Utility functions and configurations
└── types/              # TypeScript type definitions
```

## Next Steps

1. Add image upload functionality
2. Implement payment processing with Stripe
3. Add real-time messaging between buyers/sellers
4. Implement advanced search and filtering
5. Add card condition grading system

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request
