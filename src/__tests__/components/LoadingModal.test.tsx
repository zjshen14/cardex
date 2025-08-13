import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LoadingModal } from '@/components/LoadingModal'

describe('LoadingModal', () => {
  const defaultProps = {
    isOpen: true,
    status: 'loading' as const,
    title: 'Test Title',
    loadingMessage: 'Loading...',
    successMessage: 'Success!',
    errorMessage: 'Error occurred',
  }

  it('should not render when isOpen is false', () => {
    render(<LoadingModal {...defaultProps} isOpen={false} />)
    expect(screen.queryByText('Test Title')).not.toBeInTheDocument()
  })

  it('should render loading state correctly', () => {
    render(<LoadingModal {...defaultProps} status="loading" />)
    
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('should render success state correctly', () => {
    render(<LoadingModal {...defaultProps} status="success" />)
    
    expect(screen.getAllByText('Success!')).toHaveLength(2) // Appears in both title and message
    expect(screen.getByText('Redirecting...')).toBeInTheDocument()
  })

  it('should render error state correctly', () => {
    const onError = jest.fn()
    const onClose = jest.fn()
    render(<LoadingModal {...defaultProps} status="error" onError={onError} onClose={onClose} />)
    
    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('Error occurred')).toBeInTheDocument()
    expect(screen.getByText('Try Again')).toBeInTheDocument()
    expect(screen.getByText('Close')).toBeInTheDocument()
  })

  it('should call onSuccess after delay when status is success', async () => {
    const onSuccess = jest.fn()
    render(<LoadingModal {...defaultProps} status="success" onSuccess={onSuccess} />)
    
    await waitFor(() => expect(onSuccess).toHaveBeenCalled(), { timeout: 2000 })
  })

  it('should call onError when Try Again button is clicked', () => {
    const onError = jest.fn()
    render(<LoadingModal {...defaultProps} status="error" onError={onError} />)
    
    fireEvent.click(screen.getByText('Try Again'))
    expect(onError).toHaveBeenCalled()
  })

  it('should call onClose when Close button is clicked', () => {
    const onClose = jest.fn()
    render(<LoadingModal {...defaultProps} status="error" onClose={onClose} />)
    
    fireEvent.click(screen.getByText('Close'))
    expect(onClose).toHaveBeenCalled()
  })

  it('should have proper accessibility attributes', () => {
    render(<LoadingModal {...defaultProps} status="loading" />)
    
    const modal = screen.getByRole('dialog', { hidden: true })
    expect(modal).toBeInTheDocument()
  })

  it('should prevent background interaction with overlay', () => {
    render(<LoadingModal {...defaultProps} status="loading" />)
    
    const overlay = document.querySelector('.bg-gray-500')
    expect(overlay).toBeInTheDocument()
    expect(overlay).toHaveClass('fixed', 'inset-0')
  })
})