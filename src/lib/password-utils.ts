import bcrypt from 'bcryptjs'

export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
  score: number // 0-4 (weak to very strong)
}

export interface PasswordRequirements {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  maxLength: number
}

export const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxLength: 128
}

export function validatePassword(
  password: string, 
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): PasswordValidationResult {
  const errors: string[] = []
  let score = 0

  // Length check
  if (password.length < requirements.minLength) {
    errors.push(`Password must be at least ${requirements.minLength} characters long`)
  } else if (password.length >= requirements.minLength) {
    score += 1
  }

  if (password.length > requirements.maxLength) {
    errors.push(`Password must be no more than ${requirements.maxLength} characters long`)
  }

  // Character requirements
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  if (requirements.requireUppercase && !hasUppercase) {
    errors.push('Password must contain at least one uppercase letter')
  } else if (hasUppercase) {
    score += 1
  }

  if (requirements.requireLowercase && !hasLowercase) {
    errors.push('Password must contain at least one lowercase letter')
  } else if (hasLowercase) {
    score += 1
  }

  if (requirements.requireNumbers && !hasNumbers) {
    errors.push('Password must contain at least one number')
  } else if (hasNumbers) {
    score += 1
  }

  if (requirements.requireSpecialChars && !hasSpecialChars) {
    errors.push('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)')
  } else if (hasSpecialChars) {
    score += 1
  }

  // Additional security checks
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
    'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1'
  ]
  
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    errors.push('Password contains common words and is not secure')
    score = Math.max(0, score - 2)
  }

  // Sequential characters check
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password)) {
    errors.push('Password should not contain sequential letters')
    score = Math.max(0, score - 1)
  }

  if (/(?:123|234|345|456|567|678|789|890)/.test(password)) {
    errors.push('Password should not contain sequential numbers')
    score = Math.max(0, score - 1)
  }

  // Repeated characters check
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password should not contain repeated characters')
    score = Math.max(0, score - 1)
  }

  return {
    isValid: errors.length === 0,
    errors,
    score: Math.max(0, Math.min(4, score))
  }
}

export function getPasswordStrengthText(score: number): { text: string; color: string } {
  switch (score) {
    case 0:
    case 1:
      return { text: 'Very Weak', color: 'text-red-600' }
    case 2:
      return { text: 'Weak', color: 'text-orange-600' }
    case 3:
      return { text: 'Fair', color: 'text-yellow-600' }
    case 4:
      return { text: 'Strong', color: 'text-green-600' }
    default:
      return { text: 'Very Strong', color: 'text-green-700' }
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generatePasswordRequirementsText(requirements: PasswordRequirements): string[] {
  const rules: string[] = []
  
  rules.push(`At least ${requirements.minLength} characters long`)
  
  if (requirements.requireUppercase) {
    rules.push('At least one uppercase letter (A-Z)')
  }
  
  if (requirements.requireLowercase) {
    rules.push('At least one lowercase letter (a-z)')
  }
  
  if (requirements.requireNumbers) {
    rules.push('At least one number (0-9)')
  }
  
  if (requirements.requireSpecialChars) {
    rules.push('At least one special character (!@#$%^&*(),.?":{}|<>)')
  }
  
  rules.push('No common passwords or sequential characters')
  rules.push(`Maximum ${requirements.maxLength} characters`)
  
  return rules
}