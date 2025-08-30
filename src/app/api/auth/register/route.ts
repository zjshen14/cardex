import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validatePassword, hashPassword } from '@/lib/password-utils'
import { rateLimiter, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    // Rate limiting for registration attempts
    const rateLimit = rateLimiter.check(req, RATE_LIMIT_CONFIGS.REGISTRATION)
    if (!rateLimit.allowed) {
      const resetTime = new Date(rateLimit.resetTime).toISOString()
      return NextResponse.json(
        { 
          error: rateLimit.blocked 
            ? `Too many registration attempts. Try again after ${resetTime}` 
            : 'Rate limit exceeded. Please try again later.',
          remainingAttempts: rateLimit.remainingAttempts,
          resetTime
        },
        { status: 429 }
      )
    }

    const { email, password, name, username } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Password does not meet security requirements',
          passwordErrors: passwordValidation.errors
        },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        username: username || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
      }
    })

    return NextResponse.json({
      message: 'User created successfully',
      user
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}