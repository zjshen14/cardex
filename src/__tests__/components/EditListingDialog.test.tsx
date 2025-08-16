import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EditListingDialog } from '@/components/EditListingDialog'

// Mock fetch globally
global.fetch = jest.fn()

// Mock card data
const mockCard = {
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
  imageUrls: '["https://example.com/image1.jpg", "https://example.com/image2.jpg"]',
}

describe('EditListingDialog', () => {
  const mockOnClose = jest.fn()
  const mockOnSave = jest.fn()
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock fetch to return empty response (no new images uploaded)
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ urls: [] }),
    } as Response)
  })

  it('should not render when closed', () => {
    render(
      <EditListingDialog
        isOpen={false}
        card={mockCard}
        onClose={mockOnClose}
        onSave={mockOnSave}
        isLoading={false}
      />
    )

    expect(screen.queryByText('Edit Listing')).not.toBeInTheDocument()
  })

  it('should render when open with populated form fields', async () => {
    render(
      <EditListingDialog
        isOpen={true}
        card={mockCard}
        onClose={mockOnClose}
        onSave={mockOnSave}
        isLoading={false}
      />
    )

    expect(screen.getByText('Edit Listing')).toBeInTheDocument()
    
    // Wait for the form to be populated via useEffect
    await waitFor(() => {
      expect(screen.getByDisplayValue('Charizard')).toBeInTheDocument()
    })
    
    expect(screen.getByDisplayValue('Rare Pokemon card')).toBeInTheDocument()
    expect(screen.getByDisplayValue('100')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Trading Cards')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Base Set')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Rare')).toBeInTheDocument()
    expect(screen.getByDisplayValue('4/102')).toBeInTheDocument()
    expect(screen.getByDisplayValue('1999')).toBeInTheDocument()
    
    // Check condition specifically by element
    const conditionSelect = screen.getByLabelText('Condition *')
    expect(conditionSelect).toHaveValue('MINT')
  })

  it('should handle null card gracefully', () => {
    render(
      <EditListingDialog
        isOpen={true}
        card={null}
        onClose={mockOnClose}
        onSave={mockOnSave}
        isLoading={false}
      />
    )

    expect(screen.getByText('Edit Listing')).toBeInTheDocument()
    // Form should have default empty values
    const titleInput = screen.getByLabelText('Card Title *')
    expect(titleInput).toHaveValue('')
  })

  it('should populate form with card data including null fields', async () => {
    const cardWithNulls = {
      ...mockCard,
      description: null,
      set: null,
      rarity: null,
      cardNumber: null,
      year: null,
    }

    render(
      <EditListingDialog
        isOpen={true}
        card={cardWithNulls}
        onClose={mockOnClose}
        onSave={mockOnSave}
        isLoading={false}
      />
    )

    // Wait for form to populate
    await waitFor(() => {
      expect(screen.getByDisplayValue('Charizard')).toBeInTheDocument()
    })
    
    expect(screen.getByDisplayValue('100')).toBeInTheDocument()
    
    // Check that null fields are handled as empty strings
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

  it('should call onClose when close button is clicked', () => {
    render(
      <EditListingDialog
        isOpen={true}
        card={mockCard}
        onClose={mockOnClose}
        onSave={mockOnSave}
        isLoading={false}
      />
    )

    const closeButton = screen.getByRole('button', { name: 'Close' })
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when cancel button is clicked', () => {
    render(
      <EditListingDialog
        isOpen={true}
        card={mockCard}
        onClose={mockOnClose}
        onSave={mockOnSave}
        isLoading={false}
      />
    )

    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when background is clicked', () => {
    render(
      <EditListingDialog
        isOpen={true}
        card={mockCard}
        onClose={mockOnClose}
        onSave={mockOnSave}
        isLoading={false}
      />
    )

    const backdrop = screen.getByRole('dialog').parentElement?.querySelector('.fixed.inset-0.bg-gray-500')
    expect(backdrop).toBeInTheDocument()
    fireEvent.click(backdrop!)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should update form fields when user types', async () => {
    render(
      <EditListingDialog
        isOpen={true}
        card={mockCard}
        onClose={mockOnClose}
        onSave={mockOnSave}
        isLoading={false}
      />
    )

    // Wait for form to populate first
    await waitFor(() => {
      expect(screen.getByDisplayValue('Charizard')).toBeInTheDocument()
    })

    const titleInput = screen.getByLabelText('Card Title *')
    fireEvent.change(titleInput, { target: { value: 'Updated Charizard' } })

    expect(titleInput).toHaveValue('Updated Charizard')

    const priceInput = screen.getByLabelText('Price (USD) *')
    fireEvent.change(priceInput, { target: { value: '150' } })

    expect(priceInput).toHaveValue(150)
  })

  it('should call onSave with correct data when form is submitted', async () => {
    render(
      <EditListingDialog
        isOpen={true}
        card={mockCard}
        onClose={mockOnClose}
        onSave={mockOnSave}
        isLoading={false}
      />
    )

    // Update some fields
    const titleInput = screen.getByLabelText('Card Title *')
    fireEvent.change(titleInput, { target: { value: 'Updated Charizard' } })

    const priceInput = screen.getByLabelText('Price (USD) *')
    fireEvent.change(priceInput, { target: { value: '150.50' } })

    const descriptionInput = screen.getByLabelText('Description')
    fireEvent.change(descriptionInput, { target: { value: 'Updated description' } })

    // Submit form
    const saveButton = screen.getByText('Save Changes')
    fireEvent.click(saveButton)

    // Wait for async operations
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledTimes(1)
    })

    expect(mockOnSave).toHaveBeenCalledWith('card-1', {
      title: 'Updated Charizard',
      description: 'Updated description',
      condition: 'MINT',
      price: '150.50',
      category: 'Trading Cards',
      set: 'Base Set',
      rarity: 'Rare',
      cardNumber: '4/102',
      year: '1999',
      imageUrls: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    })
  })

  it('should disable all inputs and buttons when loading', () => {
    render(
      <EditListingDialog
        isOpen={true}
        card={mockCard}
        onClose={mockOnClose}
        onSave={mockOnSave}
        isLoading={true}
      />
    )

    // Check that form inputs are disabled
    expect(screen.getByLabelText('Card Title *')).toBeDisabled()
    expect(screen.getByLabelText('Description')).toBeDisabled()
    expect(screen.getByLabelText('Category *')).toBeDisabled()
    expect(screen.getByLabelText('Condition *')).toBeDisabled()
    expect(screen.getByLabelText('Price (USD) *')).toBeDisabled()

    // Check that buttons are disabled and show loading state
    expect(screen.getByRole('button', { name: 'Close' })).toBeDisabled()
    expect(screen.getByText('Cancel')).toBeDisabled()
    expect(screen.getByText('Saving...')).toBeInTheDocument()
    expect(screen.getByText('Saving...')).toBeDisabled()
  })

  it('should not call onClose when loading and close button is clicked', () => {
    render(
      <EditListingDialog
        isOpen={true}
        card={mockCard}
        onClose={mockOnClose}
        onSave={mockOnSave}
        isLoading={true}
      />
    )

    const closeButton = screen.getByRole('button', { name: 'Close' })
    fireEvent.click(closeButton)

    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('should handle all form field updates correctly', async () => {
    render(
      <EditListingDialog
        isOpen={true}
        card={mockCard}
        onClose={mockOnClose}
        onSave={mockOnSave}
        isLoading={false}
      />
    )

    // Update all fields
    fireEvent.change(screen.getByLabelText('Card Title *'), { target: { value: 'New Title' } })
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'New Description' } })
    fireEvent.change(screen.getByLabelText('Category *'), { target: { value: 'Sports Cards' } })
    fireEvent.change(screen.getByLabelText('Condition *'), { target: { value: 'NEAR_MINT' } })
    fireEvent.change(screen.getByLabelText('Set'), { target: { value: 'New Set' } })
    fireEvent.change(screen.getByLabelText('Rarity'), { target: { value: 'Ultra Rare' } })
    fireEvent.change(screen.getByLabelText('Card Number'), { target: { value: '1/100' } })
    fireEvent.change(screen.getByLabelText('Year'), { target: { value: '2000' } })
    fireEvent.change(screen.getByLabelText('Price (USD) *'), { target: { value: '200.99' } })

    // Submit form
    fireEvent.click(screen.getByText('Save Changes'))

    // Wait for async operations
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith('card-1', {
        title: 'New Title',
        description: 'New Description',
        category: 'Sports Cards',
        condition: 'NEAR_MINT',
        set: 'New Set',
        rarity: 'Ultra Rare',
        cardNumber: '1/100',
        year: '2000',
        price: '200.99',
        imageUrls: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
      })
    })
  })

  it('should not submit form when title is empty', () => {
    render(
      <EditListingDialog
        isOpen={true}
        card={mockCard}
        onClose={mockOnClose}
        onSave={mockOnSave}
        isLoading={false}
      />
    )

    // Clear title field
    const titleInput = screen.getByLabelText('Card Title *')
    fireEvent.change(titleInput, { target: { value: '' } })

    // Try to submit form
    fireEvent.click(screen.getByText('Save Changes'))

    // Form should not submit due to HTML5 validation
    expect(mockOnSave).not.toHaveBeenCalled()
  })

  it('should not submit form when price is empty', () => {
    render(
      <EditListingDialog
        isOpen={true}
        card={mockCard}
        onClose={mockOnClose}
        onSave={mockOnSave}
        isLoading={false}
      />
    )

    // Clear price field
    const priceInput = screen.getByLabelText('Price (USD) *')
    fireEvent.change(priceInput, { target: { value: '' } })

    // Try to submit form
    fireEvent.click(screen.getByText('Save Changes'))

    // Form should not submit due to HTML5 validation
    expect(mockOnSave).not.toHaveBeenCalled()
  })
})