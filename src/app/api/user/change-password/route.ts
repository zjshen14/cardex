import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validatePassword, hashPassword, verifyPassword } from '@/lib/password-utils'
import { rateLimiter, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit'

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const typedSession = session as any
    if (!typedSession?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Rate limiting for password change attempts
    const userId = typedSession.user.id
    const rateLimit = rateLimiter.check(req, {
      ...RATE_LIMIT_CONFIGS.PASSWORD_CHANGE,
      identifier: userId
    })
    if (!rateLimit.allowed) {
      const resetTime = new Date(rateLimit.resetTime).toISOString()
      return NextResponse.json(
        { 
          error: rateLimit.blocked 
            ? `Too many password change attempts. Try again after ${resetTime}` 
            : 'Rate limit exceeded. Please try again later.',
          remainingAttempts: rateLimit.remainingAttempts,
          resetTime
        },
        { status: 429 }
      )
    }

    const { currentPassword, newPassword } = await req.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      )
    }

    // Get user with current password hash
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true }
    })

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'User not found or no password set' },
        { status: 404 }
      )
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    // Check if new password is the same as current password
    const isSamePassword = await verifyPassword(newPassword, user.password)
    if (isSamePassword) {
      return NextResponse.json(
        { error: 'New password must be different from current password' },
        { status: 400 }
      )
    }

    // Validate new password strength
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'New password does not meet security requirements',
          passwordErrors: passwordValidation.errors
        },
        { status: 400 }
      )
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword)

    // Update password in database
    await prisma.user.update({
      where: { id: userId },
      data: { 
        password: newPasswordHash,
        updatedAt: new Date()
      }
    })

    // Reset rate limit on successful password change
    rateLimiter.reset(req, userId)

    return NextResponse.json({
      message: 'Password changed successfully'
    })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}