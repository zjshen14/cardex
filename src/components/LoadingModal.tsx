'use client'

import { useEffect } from 'react'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface LoadingModalProps {
  isOpen: boolean
  status: 'loading' | 'success' | 'error'
  title: string
  loadingMessage: string
  successMessage: string
  errorMessage: string
  onSuccess?: () => void
  onError?: () => void
  onClose?: () => void
}

export function LoadingModal({
  isOpen,
  status,
  title,
  loadingMessage,
  successMessage,
  errorMessage,
  onSuccess,
  onError,
  onClose,
}: LoadingModalProps) {
  useEffect(() => {
    if (status === 'success' && onSuccess) {
      // Wait a moment to show success state, then redirect
      const timer = setTimeout(onSuccess, 1500)
      return () => clearTimeout(timer)
    }
  }, [status, onSuccess])

  if (!isOpen) return null

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <Loader2 className="h-16 w-16 text-blue-600 animate-spin mx-auto mb-4" data-testid="loading-spinner" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600">{loadingMessage}</p>
          </div>
        )
      case 'success':
        return (
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Success!</h3>
            <p className="text-gray-600">{successMessage}</p>
            <p className="text-sm text-gray-500 mt-2">Redirecting...</p>
          </div>
        )
      case 'error':
        return (
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600 mb-4">{errorMessage}</p>
            <div className="flex justify-center space-x-4">
              {onError && (
                <button
                  onClick={onError}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Try Again
                </button>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6" role="dialog" aria-modal="true">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}