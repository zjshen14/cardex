import { render, screen, fireEvent } from '@testing-library/react'
import { ViewListingModal } from '@/components/ViewListingModal'

// Mock card data with all possible fields
const mockCard = {
  id: 'card-1',
  title: 'Charizard Base Set',
  description: 'This is a rare Charizard card from the original Base Set. In excellent condition with minimal wear on the edges. Perfect for collectors!',
  condition: 'MINT',
  price: 150.99,
  category: 'Trading Cards',
  set: 'Base Set',
  rarity: 'Rare Holo',
  cardNumber: '4/102',
  year: 1999,
  imageUrls: '["https://example.com/image1.jpg", "https://example.com/image2.jpg"]',
  status: 'ACTIVE',
  createdAt: '2023-01-15T10:30:00Z',
  updatedAt: '2023-01-20T14:45:00Z',
  seller: {
    id: 'seller-1',
    name: 'John Doe',
    username: 'johndoe123'
  },
  transactions: [
    {
      id: 'txn-1',
      status: 'COMPLETED',
      amount: 150.99,
      createdAt: '2023-01-25T09:15:00Z',
      buyer: {
        name: 'Jane Smith',
        username: 'janesmith'
      }
    },
    {
      id: 'txn-2',
      status: 'PENDING',
      amount: 150.99,
      createdAt: '2023-01-26T11:20:00Z',
      buyer: {
        name: null,
        username: 'anonymousbuyer'
      }
    }
  ]
}

// Mock card with minimal data (null/empty fields)
const mockCardMinimal = {
  id: 'card-2',
  title: 'Simple Card',
  description: null,
  condition: 'GOOD',
  price: 25.00,
  category: 'Gaming Cards',
  set: null,
  rarity: null,
  cardNumber: null,
  year: null,
  imageUrls: '[]',
  status: 'SOLD',
  createdAt: '2023-02-01T12:00:00Z',
  updatedAt: '2023-02-01T12:00:00Z',
  seller: {
    id: 'seller-2',
    name: null,
    username: null
  }
}

describe('ViewListingModal', () => {
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not render when closed', () => {
    render(
      <ViewListingModal
        isOpen={false}
        card={mockCard}
        onClose={mockOnClose}
      />
    )

    expect(screen.queryByText('Charizard Base Set')).not.toBeInTheDocument()
  })

  it('should not render when card is null', () => {
    render(
      <ViewListingModal
        isOpen={true}
        card={null}
        onClose={mockOnClose}
      />
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should render modal with complete card information', () => {
    render(
      <ViewListingModal
        isOpen={true}
        card={mockCard}
        onClose={mockOnClose}
      />
    )

    // Header information
    expect(screen.getByText('Charizard Base Set')).toBeInTheDocument()
    const priceElements = screen.getAllByText('$150.99')
    expect(priceElements.length).toBeGreaterThan(0)
    expect(screen.getByText('Mint')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()

    // Description
    expect(screen.getByText('Description')).toBeInTheDocument()
    expect(screen.getByText(/This is a rare Charizard card/)).toBeInTheDocument()

    // Card Information section
    expect(screen.getByText('Card Information')).toBeInTheDocument()
    expect(screen.getByText('Trading Cards')).toBeInTheDocument()
    expect(screen.getByText('Base Set')).toBeInTheDocument()
    expect(screen.getByText('Rare Holo')).toBeInTheDocument()
    expect(screen.getByText('4/102')).toBeInTheDocument()
    expect(screen.getByText('1999')).toBeInTheDocument()

    // Seller information
    expect(screen.getByText('Seller')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()

    // Listing Information
    expect(screen.getByText('Listing Information')).toBeInTheDocument()
    expect(screen.getByText(/Listed on:/)).toBeInTheDocument()
    expect(screen.getByText(/Updated:/)).toBeInTheDocument()

    // Transaction History
    expect(screen.getByText('Transaction History')).toBeInTheDocument()
    expect(screen.getByText('completed')).toBeInTheDocument()
    expect(screen.getByText('pending')).toBeInTheDocument()
    expect(screen.getByText(/Buyer: Jane Smith/)).toBeInTheDocument()
    expect(screen.getByText(/Buyer: anonymousbuyer/)).toBeInTheDocument()
  })

  it('should render modal with minimal card data', () => {
    render(
      <ViewListingModal
        isOpen={true}
        card={mockCardMinimal}
        onClose={mockOnClose}
      />
    )

    // Basic information should be present
    expect(screen.getByText('Simple Card')).toBeInTheDocument()
    expect(screen.getByText('$25.00')).toBeInTheDocument()
    expect(screen.getByText('Good')).toBeInTheDocument()
    expect(screen.getByText('Sold')).toBeInTheDocument()
    expect(screen.getByText('Gaming Cards')).toBeInTheDocument()

    // Should show anonymous seller
    expect(screen.getByText('Anonymous Seller')).toBeInTheDocument()

    // Should not show optional sections when data is null
    expect(screen.queryByText('Description')).not.toBeInTheDocument()
    expect(screen.queryByText('Images')).not.toBeInTheDocument()
    expect(screen.queryByText('Transaction History')).not.toBeInTheDocument()
  })

  it('should handle images display correctly', () => {
    const cardWithImages = {
      ...mockCard,
      imageUrls: '["https://example.com/image1.jpg", "https://example.com/image2.jpg", "https://example.com/image3.jpg", "https://example.com/image4.jpg", "https://example.com/image5.jpg"]'
    }

    render(
      <ViewListingModal
        isOpen={true}
        card={cardWithImages}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('Images')).toBeInTheDocument()
    
    // Should show first 4 images
    const images = screen.getAllByRole('img')
    expect(images).toHaveLength(4)
    
    // Should show "+1 more images" text
    expect(screen.getByText('+1 more images')).toBeInTheDocument()
  })

  it('should handle invalid JSON in imageUrls gracefully', () => {
    const cardWithInvalidImages = {
      ...mockCard,
      imageUrls: 'invalid-json'
    }

    render(
      <ViewListingModal
        isOpen={true}
        card={cardWithInvalidImages}
        onClose={mockOnClose}
      />
    )

    // Should not crash and should not show images section
    expect(screen.getByText('Charizard Base Set')).toBeInTheDocument()
    expect(screen.queryByText('Images')).not.toBeInTheDocument()
  })

  it('should call onClose when close button is clicked', () => {
    render(
      <ViewListingModal
        isOpen={true}
        card={mockCard}
        onClose={mockOnClose}
      />
    )

    // Find the footer close button (not the sr-only text)
    const closeButtons = screen.getAllByText('Close')
    const footerCloseButton = closeButtons.find(button => button.tagName === 'BUTTON')
    expect(footerCloseButton).toBeInTheDocument()
    fireEvent.click(footerCloseButton!)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when X button is clicked', () => {
    render(
      <ViewListingModal
        isOpen={true}
        card={mockCard}
        onClose={mockOnClose}
      />
    )

    // Click the X button in the header by finding the button that contains the X icon
    const buttons = screen.getAllByRole('button')
    const xButton = buttons.find(button => button.querySelector('svg'))
    expect(xButton).toBeInTheDocument()
    fireEvent.click(xButton!)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when backdrop is clicked', () => {
    render(
      <ViewListingModal
        isOpen={true}
        card={mockCard}
        onClose={mockOnClose}
      />
    )

    const backdrop = document.querySelector('.fixed.inset-0.bg-gray-500')
    expect(backdrop).toBeInTheDocument()
    fireEvent.click(backdrop!)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should format condition names correctly', () => {
    const conditionTests = [
      { condition: 'MINT', expected: 'Mint' },
      { condition: 'NEAR_MINT', expected: 'Near Mint' },
      { condition: 'LIGHT_PLAYED', expected: 'Light Played' },
      { condition: 'POOR', expected: 'Poor' }
    ]

    conditionTests.forEach(({ condition, expected }) => {
      const cardWithCondition = { ...mockCard, condition }
      
      const { rerender } = render(
        <ViewListingModal
          isOpen={true}
          card={cardWithCondition}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText(expected)).toBeInTheDocument()
      
      // Clean up for next iteration
      rerender(
        <ViewListingModal
          isOpen={false}
          card={cardWithCondition}
          onClose={mockOnClose}
        />
      )
    })
  })

  it('should format dates correctly', () => {
    render(
      <ViewListingModal
        isOpen={true}
        card={mockCard}
        onClose={mockOnClose}
      />
    )

    // Should show formatted dates (exact format depends on locale)
    expect(screen.getByText(/January 15, 2023/)).toBeInTheDocument()
    expect(screen.getByText(/January 20, 2023/)).toBeInTheDocument()
  })

  it('should display transaction status with correct styling', () => {
    render(
      <ViewListingModal
        isOpen={true}
        card={mockCard}
        onClose={mockOnClose}
      />
    )

    const completedStatus = screen.getByText('completed')
    const pendingStatus = screen.getByText('pending')

    expect(completedStatus).toHaveClass('bg-green-100', 'text-green-800')
    expect(pendingStatus).toHaveClass('bg-yellow-100', 'text-yellow-800')
  })

  it('should display condition with correct styling', () => {
    render(
      <ViewListingModal
        isOpen={true}
        card={mockCard}
        onClose={mockOnClose}
      />
    )

    const conditionBadge = screen.getByText('Mint')
    expect(conditionBadge).toHaveClass('bg-green-100', 'text-green-800')
  })

  it('should display active/inactive status correctly', () => {
    // Test active status
    render(
      <ViewListingModal
        isOpen={true}
        card={mockCard}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('Active')).toHaveClass('bg-green-100', 'text-green-800')

    // Test inactive status
    const { rerender } = render(
      <ViewListingModal
        isOpen={true}
        card={mockCardMinimal}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('Sold')).toHaveClass('bg-red-100', 'text-red-800')
  })

  it('should limit transaction history display to 3 items', () => {
    const cardWithManyTransactions = {
      ...mockCard,
      transactions: [
        ...mockCard.transactions!,
        {
          id: 'txn-3',
          status: 'CANCELLED',
          amount: 150.99,
          createdAt: '2023-01-27T10:00:00Z',
          buyer: { name: 'Buyer Three', username: 'buyer3' }
        },
        {
          id: 'txn-4',
          status: 'REFUNDED',
          amount: 150.99,
          createdAt: '2023-01-28T15:30:00Z',
          buyer: { name: 'Buyer Four', username: 'buyer4' }
        }
      ]
    }

    render(
      <ViewListingModal
        isOpen={true}
        card={cardWithManyTransactions}
        onClose={mockOnClose}
      />
    )

    // Should show "+1 more transactions" text
    expect(screen.getByText('+1 more transactions')).toBeInTheDocument()
    
    // Should only show first 3 transactions
    expect(screen.getByText('completed')).toBeInTheDocument()
    expect(screen.getByText('pending')).toBeInTheDocument()
    expect(screen.getByText('cancelled')).toBeInTheDocument()
    expect(screen.queryByText('refunded')).not.toBeInTheDocument()
  })

  it('should handle seller name fallback correctly', () => {
    const sellerTests = [
      { name: 'John Doe', username: 'john', expected: 'John Doe' },
      { name: null, username: 'john', expected: 'john' },
      { name: null, username: null, expected: 'Anonymous Seller' }
    ]

    sellerTests.forEach(({ name, username, expected }) => {
      const cardWithSeller = { 
        ...mockCard, 
        seller: { id: 'test', name, username } 
      }
      
      const { rerender } = render(
        <ViewListingModal
          isOpen={true}
          card={cardWithSeller}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText(expected)).toBeInTheDocument()
      
      // Clean up for next iteration
      rerender(
        <ViewListingModal
          isOpen={false}
          card={cardWithSeller}
          onClose={mockOnClose}
        />
      )
    })
  })

  it('should not show updated date when same as created date', () => {
    const cardSameDates = {
      ...mockCard,
      updatedAt: mockCard.createdAt
    }

    render(
      <ViewListingModal
        isOpen={true}
        card={cardSameDates}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText(/Listed on:/)).toBeInTheDocument()
    expect(screen.queryByText(/Updated:/)).not.toBeInTheDocument()
  })
})