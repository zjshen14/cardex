import { render, screen, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import MyCardsPage from '@/app/listings/page'

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

const mockCards = [
  {
    id: 'card-1',
    title: 'Charizard',
    description: 'Rare Pokemon card',
    condition: 'MINT',
    price: 100.00,
    category: 'Trading Cards',
    set: 'Base Set',
    rarity: 'Rare',
    cardNumber: '4/102',
    year: 1999,
    imageUrls: '[]',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    seller: {
      id: 'user-123',
      name: 'Test User',
      username: 'testuser'
    },
    transactions: [
      {
        id: 'txn-1',
        status: 'COMPLETED',
        amount: 100.00,
        createdAt: '2024-01-02T00:00:00Z',
        buyer: {
          name: 'Buyer Name',
          username: 'buyer'
        }
      }
    ]
  },
  {
    id: 'card-2',
    title: 'Blastoise',
    description: 'Water Pokemon',
    condition: 'NEAR_MINT',
    price: 75.00,
    category: 'Trading Cards',
    set: null,
    rarity: null,
    cardNumber: null,
    year: null,
    imageUrls: '[]',
    isActive: true,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
    seller: {
      id: 'user-123',
      name: 'Test User',
      username: 'testuser'
    },
    transactions: []
  }
]

describe('MyCardsPage (Listings)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
  })

  it('should show loading state when session is loading', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'loading',
    })

    render(<MyCardsPage />)
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('should redirect to signin when not authenticated', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    render(<MyCardsPage />)
    
    expect(mockPush).toHaveBeenCalledWith('/auth/signin')
  })

  it('should render listings page with cards', async () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
    })

    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue(mockCards),
    }
    ;(fetch as jest.Mock).mockResolvedValue(mockResponse)

    render(<MyCardsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('My Listings')).toBeInTheDocument()
    })

    expect(screen.getByText('Charizard')).toBeInTheDocument()
    expect(screen.getByText('Blastoise')).toBeInTheDocument()
    expect(screen.getByText('$100.00')).toBeInTheDocument()
    expect(screen.getByText('$75.00')).toBeInTheDocument()
    expect(screen.getAllByText('Trading Cards')).toHaveLength(2) // Two cards both with Trading Cards category
    expect(screen.getByText('Mint')).toBeInTheDocument()
    expect(screen.getByText('Near Mint')).toBeInTheDocument()
  })

  it('should show empty state when no cards are found', async () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
    })

    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue([]),
    }
    ;(fetch as jest.Mock).mockResolvedValue(mockResponse)

    render(<MyCardsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('No listings yet')).toBeInTheDocument()
    })

    expect(screen.getByText('Start selling your collectible cards to reach more buyers.')).toBeInTheDocument()
    expect(screen.getByText('List Your First Card')).toBeInTheDocument()
  })

  it('should handle API fetch error', async () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
    })

    const mockResponse = {
      ok: false,
      json: jest.fn().mockResolvedValue({ error: 'Failed to fetch' }),
    }
    ;(fetch as jest.Mock).mockResolvedValue(mockResponse)

    render(<MyCardsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load your cards')).toBeInTheDocument()
    })
  })

  it('should fetch user cards on mount when authenticated', async () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
    })

    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue(mockCards),
    }
    ;(fetch as jest.Mock).mockResolvedValue(mockResponse)

    render(<MyCardsPage />)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/listings')
    })
  })

  it('should display card details correctly', async () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
    })

    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue(mockCards),
    }
    ;(fetch as jest.Mock).mockResolvedValue(mockResponse)

    render(<MyCardsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Charizard')).toBeInTheDocument()
    })

    // Check for optional fields that exist
    expect(screen.getByText('Base Set')).toBeInTheDocument()
    expect(screen.getByText('Rare')).toBeInTheDocument()
    expect(screen.getByText('4/102')).toBeInTheDocument()
    expect(screen.getByText('1999')).toBeInTheDocument()

    // Check transaction status
    expect(screen.getByText('COMPLETED')).toBeInTheDocument()
    expect(screen.getByText('No transactions yet')).toBeInTheDocument()
  })

  it('should format condition names correctly', async () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
    })

    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue(mockCards),
    }
    ;(fetch as jest.Mock).mockResolvedValue(mockResponse)

    render(<MyCardsPage />)
    
    await waitFor(() => {
      // NEAR_MINT should be formatted as "Near Mint"
      expect(screen.getByText('Near Mint')).toBeInTheDocument()
      // MINT should be formatted as "Mint"
      expect(screen.getByText('Mint')).toBeInTheDocument()
    })
  })

  it('should format dates correctly', async () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
    })

    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue(mockCards),
    }
    ;(fetch as jest.Mock).mockResolvedValue(mockResponse)

    render(<MyCardsPage />)
    
    await waitFor(() => {
      // Check that dates are formatted (exact format may vary based on locale)
      expect(screen.getByText('Listed on 1/2/2024')).toBeInTheDocument()
    })
  })

  it('should show action buttons for each card', async () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
    })

    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue(mockCards),
    }
    ;(fetch as jest.Mock).mockResolvedValue(mockResponse)

    render(<MyCardsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Charizard')).toBeInTheDocument()
    })

    // Should have view, edit, and delete buttons for each card
    const viewButtons = screen.getAllByTitle('View details')
    const editButtons = screen.getAllByTitle('Edit listing')
    const deleteButtons = screen.getAllByTitle('Delete listing')

    expect(viewButtons).toHaveLength(2) // Two cards
    expect(editButtons).toHaveLength(2)
    expect(deleteButtons).toHaveLength(2)
  })

  it('should navigate to sell page when List New Card is clicked', async () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
    })

    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue(mockCards),
    }
    ;(fetch as jest.Mock).mockResolvedValue(mockResponse)

    render(<MyCardsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('List New Card')).toBeInTheDocument()
    })

    const listNewCardButton = screen.getByText('List New Card')
    listNewCardButton.click()

    expect(mockPush).toHaveBeenCalledWith('/sell')
  })

  it('should show loading spinner initially', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
    })

    // Don't resolve the fetch immediately
    ;(fetch as jest.Mock).mockReturnValue(new Promise(() => {}))

    render(<MyCardsPage />)
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })
})