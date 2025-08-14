import { render, screen, waitFor, fireEvent } from '@testing-library/react'
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

  describe('Delete Listing Functionality', () => {
    beforeEach(() => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: { user: { email: 'test@example.com' } },
        status: 'authenticated',
      })
    })

    it('should open confirmation dialog when delete button is clicked', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockCards),
      }
      ;(fetch as jest.Mock).mockResolvedValue(mockResponse)

      render(<MyCardsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Charizard')).toBeInTheDocument()
      })

      const deleteButton = screen.getAllByTitle('Delete listing')[0]
      fireEvent.click(deleteButton)

      // Check that confirmation dialog is opened
      await waitFor(() => {
        expect(screen.getByText('Delete Listing')).toBeInTheDocument()
        expect(screen.getByText('Are you sure you want to delete "Charizard"? This action cannot be undone.')).toBeInTheDocument()
        expect(screen.getByText('Delete')).toBeInTheDocument()
        expect(screen.getByText('Cancel')).toBeInTheDocument()
      })
    })

    it('should close confirmation dialog when cancel is clicked', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockCards),
      }
      ;(fetch as jest.Mock).mockResolvedValue(mockResponse)

      render(<MyCardsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Charizard')).toBeInTheDocument()
      })

      const deleteButton = screen.getAllByTitle('Delete listing')[0]
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText('Delete Listing')).toBeInTheDocument()
      })

      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)

      // Dialog should be closed
      await waitFor(() => {
        expect(screen.queryByText('Delete Listing')).not.toBeInTheDocument()
      })
    })

    it('should successfully delete a listing', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockCards),
      }
      ;(fetch as jest.Mock).mockResolvedValue(mockResponse)

      render(<MyCardsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Charizard')).toBeInTheDocument()
        expect(screen.getByText('Blastoise')).toBeInTheDocument()
      })

      const deleteButton = screen.getAllByTitle('Delete listing')[0]
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText('Delete Listing')).toBeInTheDocument()
      })

      // Mock successful delete response
      const deleteResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true }),
      }
      ;(fetch as jest.Mock).mockResolvedValueOnce(deleteResponse)

      const confirmButton = screen.getByText('Delete')
      fireEvent.click(confirmButton)

      // Check delete API call was made
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/cards/card-1', {
          method: 'DELETE',
        })
      })

      // Check success message appears
      await waitFor(() => {
        expect(screen.getByText('Your listing has been deleted successfully!')).toBeInTheDocument()
      })

      // Check that Charizard is removed from the list but Blastoise remains
      await waitFor(() => {
        expect(screen.queryByText('Charizard')).not.toBeInTheDocument()
        expect(screen.getByText('Blastoise')).toBeInTheDocument()
      })
    })

    it('should handle delete error', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockCards),
      }
      ;(fetch as jest.Mock).mockResolvedValue(mockResponse)

      render(<MyCardsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Charizard')).toBeInTheDocument()
      })

      const deleteButton = screen.getAllByTitle('Delete listing')[0]
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText('Delete Listing')).toBeInTheDocument()
      })

      // Mock error response
      const errorResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({ error: 'Failed to delete listing' }),
      }
      ;(fetch as jest.Mock).mockResolvedValueOnce(errorResponse)

      const confirmButton = screen.getByText('Delete')
      fireEvent.click(confirmButton)

      // Check error message appears
      await waitFor(() => {
        expect(screen.getByText('Failed to delete listing')).toBeInTheDocument()
      })

      // Check that card is still in the list
      expect(screen.getByText('Charizard')).toBeInTheDocument()
    })

    it('should show loading state during delete operation', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockCards),
      }
      ;(fetch as jest.Mock).mockResolvedValue(mockResponse)

      render(<MyCardsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Charizard')).toBeInTheDocument()
      })

      const deleteButton = screen.getAllByTitle('Delete listing')[0]
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText('Delete Listing')).toBeInTheDocument()
      })

      // Mock slow delete response
      const deletePromise = new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: jest.fn().mockResolvedValue({ success: true }),
          })
        }, 100)
      })
      ;(fetch as jest.Mock).mockReturnValueOnce(deletePromise)

      const confirmButton = screen.getByText('Delete')
      fireEvent.click(confirmButton)

      // Check loading message appears
      await waitFor(() => {
        expect(screen.getByText('Deleting your listing...')).toBeInTheDocument()
      })
    })

    it('should disable delete buttons during delete operation', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockCards),
      }
      ;(fetch as jest.Mock).mockResolvedValue(mockResponse)

      render(<MyCardsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Charizard')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByTitle('Delete listing')
      fireEvent.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Delete Listing')).toBeInTheDocument()
      })

      // Mock slow delete response
      const deletePromise = new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: jest.fn().mockResolvedValue({ success: true }),
          })
        }, 100)
      })
      ;(fetch as jest.Mock).mockReturnValueOnce(deletePromise)

      const confirmButton = screen.getByText('Delete')
      fireEvent.click(confirmButton)

      // Check that all delete buttons are disabled during operation
      await waitFor(() => {
        deleteButtons.forEach(button => {
          expect(button).toBeDisabled()
        })
      })
    })

    it('should handle network error during delete', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockCards),
      }
      ;(fetch as jest.Mock).mockResolvedValue(mockResponse)

      render(<MyCardsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Charizard')).toBeInTheDocument()
      })

      const deleteButton = screen.getAllByTitle('Delete listing')[0]
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText('Delete Listing')).toBeInTheDocument()
      })

      // Mock network error
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const confirmButton = screen.getByText('Delete')
      fireEvent.click(confirmButton)

      // Check error message appears
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })

      // Check that card is still in the list
      expect(screen.getByText('Charizard')).toBeInTheDocument()
    })

    it('should automatically close success modal after delay', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockCards),
      }
      ;(fetch as jest.Mock).mockResolvedValue(mockResponse)

      render(<MyCardsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Charizard')).toBeInTheDocument()
      })

      const deleteButton = screen.getAllByTitle('Delete listing')[0]
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText('Delete Listing')).toBeInTheDocument()
      })

      // Mock successful delete response
      const deleteResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true }),
      }
      ;(fetch as jest.Mock).mockResolvedValueOnce(deleteResponse)

      const confirmButton = screen.getByText('Delete')
      fireEvent.click(confirmButton)

      // Wait for success message
      await waitFor(() => {
        expect(screen.getByText('Your listing has been deleted successfully!')).toBeInTheDocument()
      })

      // Check that success modal is automatically closed after delay
      await waitFor(() => {
        expect(screen.queryByText('Your listing has been deleted successfully!')).not.toBeInTheDocument()
      }, { timeout: 2000 })
    })

    it('should show close button for error modal', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockCards),
      }
      ;(fetch as jest.Mock).mockResolvedValue(mockResponse)

      render(<MyCardsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Charizard')).toBeInTheDocument()
      })

      const deleteButton = screen.getAllByTitle('Delete listing')[0]
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText('Delete Listing')).toBeInTheDocument()
      })

      // Mock error response
      const errorResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({ error: 'Failed to delete listing' }),
      }
      ;(fetch as jest.Mock).mockResolvedValueOnce(errorResponse)

      const confirmButton = screen.getByText('Delete')
      fireEvent.click(confirmButton)

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText('Failed to delete listing')).toBeInTheDocument()
      })

      // Check that close button exists and works
      const closeButtons = screen.getAllByRole('button', { name: 'Close' })
      const modalCloseButton = closeButtons.find(button => 
        button.textContent === 'Close' && !button.querySelector('svg')
      )
      expect(modalCloseButton).toBeInTheDocument()
      fireEvent.click(modalCloseButton!)

      // Check that error modal is closed
      await waitFor(() => {
        expect(screen.queryByText('Failed to delete listing')).not.toBeInTheDocument()
      })
    })
  })

  describe('Edit Listing Functionality', () => {
    beforeEach(() => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: { user: { email: 'test@example.com' } },
        status: 'authenticated',
      })
    })

    it('should open edit dialog when edit button is clicked', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockCards),
      }
      ;(fetch as jest.Mock).mockResolvedValue(mockResponse)

      render(<MyCardsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Charizard')).toBeInTheDocument()
      })

      const editButton = screen.getAllByTitle('Edit listing')[0]
      fireEvent.click(editButton)

      // Check that edit dialog is opened
      await waitFor(() => {
        expect(screen.getByText('Edit Listing')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Charizard')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Rare Pokemon card')).toBeInTheDocument()
        expect(screen.getByDisplayValue('100')).toBeInTheDocument()
        
        // Check condition specifically by element
        const conditionSelect = screen.getByLabelText('Condition *')
        expect(conditionSelect).toHaveValue('MINT')
      })
    })

    it('should close edit dialog when cancel is clicked', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockCards),
      }
      ;(fetch as jest.Mock).mockResolvedValue(mockResponse)

      render(<MyCardsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Charizard')).toBeInTheDocument()
      })

      const editButton = screen.getAllByTitle('Edit listing')[0]
      fireEvent.click(editButton)

      await waitFor(() => {
        expect(screen.getByText('Edit Listing')).toBeInTheDocument()
      })

      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)

      // Dialog should be closed
      await waitFor(() => {
        expect(screen.queryByText('Edit Listing')).not.toBeInTheDocument()
      })
    })

    it('should successfully update a listing', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockCards),
      }
      ;(fetch as jest.Mock).mockResolvedValue(mockResponse)

      render(<MyCardsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Charizard')).toBeInTheDocument()
      })

      const editButton = screen.getAllByTitle('Edit listing')[0]
      fireEvent.click(editButton)

      await waitFor(() => {
        expect(screen.getByText('Edit Listing')).toBeInTheDocument()
      })

      // Update the title and price
      const titleInput = screen.getByLabelText('Card Title *')
      fireEvent.change(titleInput, { target: { value: 'Updated Charizard' } })

      const priceInput = screen.getByLabelText('Price (USD) *')
      fireEvent.change(priceInput, { target: { value: '150.50' } })

      // Mock successful update response
      const updatedCard = {
        ...mockCards[0],
        title: 'Updated Charizard',
        price: 150.50,
      }
      const updateResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(updatedCard),
      }
      ;(fetch as jest.Mock).mockResolvedValueOnce(updateResponse)

      const saveButton = screen.getByText('Save Changes')
      fireEvent.click(saveButton)

      // Check update API call was made
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/cards/card-1', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Updated Charizard',
            description: 'Rare Pokemon card',
            condition: 'MINT',
            price: '150.50',
            category: 'Trading Cards',
            set: 'Base Set',
            rarity: 'Rare',
            cardNumber: '4/102',
            year: '1999',
          }),
        })
      })

      // Check success message appears
      await waitFor(() => {
        expect(screen.getByText('Your listing has been updated successfully!')).toBeInTheDocument()
      })

      // Check that card is updated in the list
      await waitFor(() => {
        expect(screen.getByText('Updated Charizard')).toBeInTheDocument()
        expect(screen.getByText('$150.50')).toBeInTheDocument()
      })
    })

    it('should handle edit error', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockCards),
      }
      ;(fetch as jest.Mock).mockResolvedValue(mockResponse)

      render(<MyCardsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Charizard')).toBeInTheDocument()
      })

      const editButton = screen.getAllByTitle('Edit listing')[0]
      fireEvent.click(editButton)

      await waitFor(() => {
        expect(screen.getByText('Edit Listing')).toBeInTheDocument()
      })

      // Mock error response
      const errorResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({ error: 'Failed to update listing' }),
      }
      ;(fetch as jest.Mock).mockResolvedValueOnce(errorResponse)

      const saveButton = screen.getByText('Save Changes')
      fireEvent.click(saveButton)

      // Check error message appears
      await waitFor(() => {
        expect(screen.getByText('Failed to update listing')).toBeInTheDocument()
      })

      // Check that card is unchanged in the list
      expect(screen.getByText('Charizard')).toBeInTheDocument()
      expect(screen.getByText('$100.00')).toBeInTheDocument()
    })

    it('should show loading state during edit operation', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockCards),
      }
      ;(fetch as jest.Mock).mockResolvedValue(mockResponse)

      render(<MyCardsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Charizard')).toBeInTheDocument()
      })

      const editButton = screen.getAllByTitle('Edit listing')[0]
      fireEvent.click(editButton)

      await waitFor(() => {
        expect(screen.getByText('Edit Listing')).toBeInTheDocument()
      })

      // Mock slow update response
      const updatePromise = new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: jest.fn().mockResolvedValue(mockCards[0]),
          })
        }, 100)
      })
      ;(fetch as jest.Mock).mockReturnValueOnce(updatePromise)

      const saveButton = screen.getByText('Save Changes')
      fireEvent.click(saveButton)

      // Check loading message appears
      await waitFor(() => {
        expect(screen.getByText('Updating your listing...')).toBeInTheDocument()
      })
    })

    it('should disable buttons during edit operation', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockCards),
      }
      ;(fetch as jest.Mock).mockResolvedValue(mockResponse)

      render(<MyCardsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Charizard')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByTitle('Edit listing')
      const deleteButtons = screen.getAllByTitle('Delete listing')
      
      fireEvent.click(editButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Edit Listing')).toBeInTheDocument()
      })

      // Mock slow update response
      const updatePromise = new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: jest.fn().mockResolvedValue(mockCards[0]),
          })
        }, 100)
      })
      ;(fetch as jest.Mock).mockReturnValueOnce(updatePromise)

      const saveButton = screen.getByText('Save Changes')
      fireEvent.click(saveButton)

      // Check that all action buttons are disabled during operation
      await waitFor(() => {
        editButtons.forEach(button => {
          expect(button).toBeDisabled()
        })
        deleteButtons.forEach(button => {
          expect(button).toBeDisabled()
        })
      })
    })

    it('should handle network error during edit', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockCards),
      }
      ;(fetch as jest.Mock).mockResolvedValue(mockResponse)

      render(<MyCardsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Charizard')).toBeInTheDocument()
      })

      const editButton = screen.getAllByTitle('Edit listing')[0]
      fireEvent.click(editButton)

      await waitFor(() => {
        expect(screen.getByText('Edit Listing')).toBeInTheDocument()
      })

      // Mock network error
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const saveButton = screen.getByText('Save Changes')
      fireEvent.click(saveButton)

      // Check error message appears
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })

      // Check that card is unchanged in the list
      expect(screen.getByText('Charizard')).toBeInTheDocument()
    })

    it('should automatically close success modal after delay', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockCards),
      }
      ;(fetch as jest.Mock).mockResolvedValue(mockResponse)

      render(<MyCardsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Charizard')).toBeInTheDocument()
      })

      const editButton = screen.getAllByTitle('Edit listing')[0]
      fireEvent.click(editButton)

      await waitFor(() => {
        expect(screen.getByText('Edit Listing')).toBeInTheDocument()
      })

      // Mock successful update response
      const updateResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockCards[0]),
      }
      ;(fetch as jest.Mock).mockResolvedValueOnce(updateResponse)

      const saveButton = screen.getByText('Save Changes')
      fireEvent.click(saveButton)

      // Wait for success message
      await waitFor(() => {
        expect(screen.getByText('Your listing has been updated successfully!')).toBeInTheDocument()
      })

      // Check that success modal is automatically closed after delay
      await waitFor(() => {
        expect(screen.queryByText('Your listing has been updated successfully!')).not.toBeInTheDocument()
      }, { timeout: 2000 })
    })

    it('should populate edit form with card data including null fields', async () => {
      const cardWithNulls = {
        ...mockCards[0],
        description: null,
        set: null,
        rarity: null,
        cardNumber: null,
        year: null,
      }

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue([cardWithNulls]),
      }
      ;(fetch as jest.Mock).mockResolvedValue(mockResponse)

      render(<MyCardsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Charizard')).toBeInTheDocument()
      })

      const editButton = screen.getAllByTitle('Edit listing')[0]
      fireEvent.click(editButton)

      await waitFor(() => {
        expect(screen.getByText('Edit Listing')).toBeInTheDocument()
      })

      // Check that form is populated correctly with null fields as empty
      expect(screen.getByDisplayValue('Charizard')).toBeInTheDocument()
      expect(screen.getByDisplayValue('100')).toBeInTheDocument()
      
      // Check that null fields are shown as empty
      const descriptionInput = screen.getByLabelText('Description')
      const setInput = screen.getByLabelText('Set')
      const rarityInput = screen.getByLabelText('Rarity')
      const cardNumberInput = screen.getByLabelText('Card Number')
      const yearInput = screen.getByLabelText('Year')
      
      expect(descriptionInput).toHaveValue('')
      expect(setInput).toHaveValue('')
      expect(rarityInput).toHaveValue('')
      expect(cardNumberInput).toHaveValue('')
      expect(yearInput).toHaveValue(null)
    })
  })
})