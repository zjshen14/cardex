'use client'

import { useEffect, useState } from 'react'
import { validatePassword, getPasswordStrengthText, generatePasswordRequirementsText, DEFAULT_PASSWORD_REQUIREMENTS, PasswordValidationResult } from '@/lib/password-utils'
import { Check, X, Info } from 'lucide-react'

interface PasswordStrengthIndicatorProps {
  password: string
  onValidationChange?: (result: PasswordValidationResult) => void
  showRequirements?: boolean
}

export function PasswordStrengthIndicator({ 
  password, 
  onValidationChange, 
  showRequirements = true 
}: PasswordStrengthIndicatorProps) {
  const [validation, setValidation] = useState<PasswordValidationResult>({
    isValid: false,
    errors: [],
    score: 0
  })

  useEffect(() => {
    const result = validatePassword(password)
    setValidation(result)
    onValidationChange?.(result)
  }, [password, onValidationChange])

  const strengthInfo = getPasswordStrengthText(validation.score)
  const requirements = generatePasswordRequirementsText(DEFAULT_PASSWORD_REQUIREMENTS)

  if (!password) {
    return showRequirements ? (
      <div className="mt-2 p-3 bg-gray-50 rounded-md">
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <Info className="h-4 w-4 mr-2" />
          Password Requirements:
        </div>
        <ul className="text-xs text-gray-500 space-y-1">
          {requirements.map((requirement, index) => (
            <li key={index} className="flex items-center">
              <div className="w-1 h-1 bg-gray-400 rounded-full mr-2"></div>
              {requirement}
            </li>
          ))}
        </ul>
      </div>
    ) : null
  }

  return (
    <div className="mt-2 space-y-2">
      {/* Strength Indicator Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">Password Strength:</span>
          <span className={`text-xs font-medium ${strengthInfo.color}`}>
            {strengthInfo.text}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${
              validation.score === 0 ? 'bg-red-500' :
              validation.score === 1 ? 'bg-red-400' :
              validation.score === 2 ? 'bg-orange-400' :
              validation.score === 3 ? 'bg-yellow-400' :
              validation.score === 4 ? 'bg-green-500' :
              'bg-green-600'
            }`}
            style={{ width: `${Math.max(10, (validation.score / 4) * 100)}%` }}
          />
        </div>
      </div>

      {/* Validation Errors */}
      {validation.errors.length > 0 && (
        <div className="p-2 bg-red-50 border border-red-200 rounded-md">
          <ul className="text-xs text-red-600 space-y-1">
            {validation.errors.map((error, index) => (
              <li key={index} className="flex items-center">
                <X className="h-3 w-3 mr-2 flex-shrink-0" />
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Requirements List (when showing requirements) */}
      {showRequirements && validation.isValid && (
        <div className="p-2 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center text-xs text-green-600">
            <Check className="h-3 w-3 mr-2" />
            Password meets all security requirements
          </div>
        </div>
      )}

      {showRequirements && password && validation.errors.length === 0 && (
        <details className="text-xs text-gray-500">
          <summary className="cursor-pointer hover:text-gray-700">View all requirements</summary>
          <ul className="mt-2 space-y-1 ml-4">
            {requirements.map((requirement, index) => (
              <li key={index} className="flex items-center">
                <Check className="h-3 w-3 mr-2 text-green-500" />
                {requirement}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}