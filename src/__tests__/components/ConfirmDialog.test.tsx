import { render, screen, fireEvent } from '@testing-library/react'
import { ConfirmDialog } from '@/components/ConfirmDialog'

describe('ConfirmDialog', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not render when isOpen is false', () => {
    render(<ConfirmDialog {...defaultProps} isOpen={false} />)
    expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument()
  })

  it('should render dialog content when isOpen is true', () => {
    render(<ConfirmDialog {...defaultProps} />)
    
    expect(screen.getByText('Confirm Action')).toBeInTheDocument()
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument()
    expect(screen.getByText('Confirm')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('should use custom button text when provided', () => {
    render(
      <ConfirmDialog 
        {...defaultProps} 
        confirmText="Delete"
        cancelText="Keep"
      />
    )
    
    expect(screen.getByText('Delete')).toBeInTheDocument()
    expect(screen.getByText('Keep')).toBeInTheDocument()
  })

  it('should call onConfirm when confirm button is clicked', () => {
    const onConfirm = jest.fn()
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />)
    
    fireEvent.click(screen.getByText('Confirm'))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('should call onCancel when cancel button is clicked', () => {
    const onCancel = jest.fn()
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />)
    
    fireEvent.click(screen.getByText('Cancel'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('should call onCancel when close button is clicked', () => {
    const onCancel = jest.fn()
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />)
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('should call onCancel when backdrop is clicked', () => {
    const onCancel = jest.fn()
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />)
    
    const backdrop = document.querySelector('.bg-gray-500')
    fireEvent.click(backdrop!)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('should apply danger variant styles', () => {
    render(<ConfirmDialog {...defaultProps} variant="danger" />)
    
    const confirmButton = screen.getByText('Confirm')
    expect(confirmButton).toHaveClass('bg-red-600', 'hover:bg-red-700')
  })

  it('should apply warning variant styles', () => {
    render(<ConfirmDialog {...defaultProps} variant="warning" />)
    
    const confirmButton = screen.getByText('Confirm')
    expect(confirmButton).toHaveClass('bg-yellow-600', 'hover:bg-yellow-700')
  })

  it('should apply default variant styles', () => {
    render(<ConfirmDialog {...defaultProps} variant="default" />)
    
    const confirmButton = screen.getByText('Confirm')
    expect(confirmButton).toHaveClass('bg-blue-600', 'hover:bg-blue-700')
  })

  it('should have proper accessibility attributes', () => {
    render(<ConfirmDialog {...defaultProps} />)
    
    const alertIcon = document.querySelector('[aria-hidden="true"]')
    expect(alertIcon).toBeInTheDocument()
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    expect(closeButton).toBeInTheDocument()
  })
})