import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// NextAuth handler for Next.js 15 App Router
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handler = NextAuth(authOptions) as any

export { handler as GET, handler as POST }