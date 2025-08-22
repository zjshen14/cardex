import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// NextAuth v4 handler for Next.js 15 App Router
// @ts-expect-error - NextAuth v4 compatibility with Next.js 15
const handler = NextAuth(authOptions)

export const GET = handler
export const POST = handler