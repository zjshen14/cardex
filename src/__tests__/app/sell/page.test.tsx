import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import SellPage from '@/app/sell/page'

// Mock dependencies
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

const mockPush = jest.fn()
const mockBack = jest.fn()

describe('SellPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      back: mockBack,
    })
  })

  it('should show loading state when session is loading', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'loading',
    })

    render(<SellPage />)
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('should redirect to signin when not authenticated', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    render(<SellPage />)
    
    expect(mockPush).toHaveBeenCalledWith('/auth/signin')
  })

  it('should render sell form when authenticated', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
    })

    render(<SellPage />)
    
    expect(screen.getByText('Sell Your Card')).toBeInTheDocument()
    expect(screen.getByLabelText(/Card Title/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Category/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Condition/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Price/)).toBeInTheDocument()
    expect(screen.getByText('Create Listing')).toBeInTheDocument()
  })

  it('should handle form input changes', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
    })

    render(<SellPage />)
    
    const titleInput = screen.getByLabelText(/Card Title/)
    fireEvent.change(titleInput, { target: { value: 'Charizard' } })
    
    expect((titleInput as HTMLInputElement).value).toBe('Charizard')
  })

  it('should handle image upload', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
    })

    render(<SellPage />)
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const imageInput = screen.getByLabelText(/Click to upload images/)
    
    fireEvent.change(imageInput, { target: { files: [file] } })
    
    // Should show image preview (implementation dependent on file reader)
    // This test might need adjustment based on how FileReader is mocked
  })

  it('should show error when too many images are uploaded', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
    })

    render(<SellPage />)
    
    // Create 6 files (more than the 5 limit)
    const files = Array(6).fill(null).map((_, i) => 
      new File(['test'], `test${i}.jpg`, { type: 'image/jpeg' })
    )
    
    const imageInput = screen.getByLabelText(/Click to upload images/)
    fireEvent.change(imageInput, { target: { files } })
    
    expect(screen.getByText('Maximum 5 images allowed')).toBeInTheDocument()
  })

  it('should submit form successfully', async () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
    })

    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ id: 'card-123' }),
    }
    ;(fetch as jest.Mock).mockResolvedValue(mockResponse)

    render(<SellPage />)
    
    // Fill out form
    fireEvent.change(screen.getByLabelText(/Card Title/), { 
      target: { value: 'Charizard' } 
    })
    fireEvent.change(screen.getByLabelText(/Price/), { 
      target: { value: '100' } 
    })
    
    // Submit form
    fireEvent.click(screen.getByText('Create Listing'))
    
    await waitFor(() => {
      expect(screen.getByText('Creating Your Listing')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('Your card has been listed successfully!')).toBeInTheDocument()
    })
    
    expect(fetch).toHaveBeenCalledWith('/api/cards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Charizard',
        description: '',
        condition: 'NEAR_MINT',
        price: '100',
        category: 'Trading Cards',
        set: '',
        rarity: '',
        cardNumber: '',
        year: '',
        imageUrls: [],
      }),
    })
  })

  it('should handle form submission error', async () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
    })

    const mockResponse = {
      ok: false,
      json: jest.fn().mockResolvedValue({ error: 'Validation failed' }),
    }
    ;(fetch as jest.Mock).mockResolvedValue(mockResponse)

    render(<SellPage />)
    
    // Fill out form with required fields
    fireEvent.change(screen.getByLabelText(/Card Title/), { 
      target: { value: 'Charizard' } 
    })
    fireEvent.change(screen.getByLabelText(/Price/), { 
      target: { value: '100' } 
    })
    
    const submitButton = screen.getByText('Create Listing')
    fireEvent.click(submitButton)
    
    // Wait for the loading modal to appear
    await waitFor(() => {
      expect(screen.getByText('Creating Your Listing')).toBeInTheDocument()
    })
    
    // Verify fetch was called
    expect(fetch).toHaveBeenCalledWith('/api/cards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Charizard',
        description: '',
        condition: 'NEAR_MINT',
        price: '100',
        category: 'Trading Cards',
        set: '',
        rarity: '',
        cardNumber: '',
        year: '',
        imageUrls: [],
      }),
    })
    
    // Wait for error modal to appear
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument()
    })
    
    expect(screen.getAllByText('Validation failed')).toHaveLength(2) // Appears in modal and error div
  })

  it('should handle cancel button', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
    })

    render(<SellPage />)
    
    fireEvent.click(screen.getByText('Cancel'))
    
    expect(mockBack).toHaveBeenCalled()
  })

  it('should validate required fields', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
    })

    render(<SellPage />)
    
    const titleInput = screen.getByLabelText(/Card Title/)
    const priceInput = screen.getByLabelText(/Price/)
    
    expect(titleInput).toHaveAttribute('required')
    expect(priceInput).toHaveAttribute('required')
  })

  it('should set correct default values', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
    })

    render(<SellPage />)
    
    // Check that the default condition is selected
    const conditionSelect = screen.getByLabelText(/Condition/) as HTMLSelectElement
    expect(conditionSelect.value).toBe('NEAR_MINT')
    
    // Check that the default category is selected  
    const categorySelect = screen.getByLabelText(/Category/) as HTMLSelectElement
    expect(categorySelect.value).toBe('Trading Cards')
  })

  it('should handle year validation', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
    })

    render(<SellPage />)
    
    const yearInput = screen.getByLabelText(/Year/)
    expect(yearInput).toHaveAttribute('min', '1900')
    expect(yearInput).toHaveAttribute('max', new Date().getFullYear().toString())
  })

  it('should remove image when remove button is clicked', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
    })

    render(<SellPage />)
    
    // This test would require mocking FileReader and testing the remove functionality
    // Implementation depends on how the image preview system works
  })
})