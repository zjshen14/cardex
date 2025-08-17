import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ContactSellerModal } from '@/components/ContactSellerModal'

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockImplementation(() => Promise.resolve()),
  },
})

describe('ContactSellerModal', () => {
  const mockOnClose = jest.fn()
  
  const mockSellerWithAllContacts = {
    id: 'seller-123',
    name: 'John Doe',
    username: 'johndoe',
    contactEmail: 'john@example.com',
    contactPhone: '+1-555-123-4567',
    contactDiscord: 'johndoe#1234',
    contactTelegram: '@johndoe',
    preferredContactMethod: 'email',
    contactNote: 'Available weekdays 9-5 EST',
    showEmail: true,
    showPhone: true,
    showDiscord: true,
    showTelegram: true,
  }

  const mockSellerWithNoContacts = {
    id: 'seller-456',
    name: 'Jane Smith',
    username: 'janesmith',
    contactEmail: null,
    contactPhone: null,
    contactDiscord: null,
    contactTelegram: null,
    preferredContactMethod: null,
    contactNote: null,
    showEmail: false,
    showPhone: false,
    showDiscord: false,
    showTelegram: false,
  }

  const mockSellerWithPrivateContacts = {
    id: 'seller-789',
    name: 'Bob Wilson',
    username: 'bobwilson',
    contactEmail: 'bob@example.com',
    contactPhone: '+1-555-987-6543',
    contactDiscord: 'bobwilson#5678',
    contactTelegram: '@bobwilson',
    preferredContactMethod: 'discord',
    contactNote: 'Prefer Discord messages',
    showEmail: false,
    showPhone: false,
    showDiscord: false,
    showTelegram: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('when modal is closed', () => {
    it('should not render when isOpen is false', () => {
      render(
        <ContactSellerModal
          isOpen={false}
          onClose={mockOnClose}
          seller={mockSellerWithAllContacts}
          cardTitle="Test Card"
          cardPrice={29.99}
        />
      )

      expect(screen.queryByText('Contact John Doe')).not.toBeInTheDocument()
    })
  })

  describe('when modal is open', () => {
    it('should render modal with seller name in header', () => {
      render(
        <ContactSellerModal
          isOpen={true}
          onClose={mockOnClose}
          seller={mockSellerWithAllContacts}
          cardTitle="Test Card"
          cardPrice={29.99}
        />
      )

      expect(screen.getByText('Contact John Doe')).toBeInTheDocument()
    })

    it('should display card information', () => {
      render(
        <ContactSellerModal
          isOpen={true}
          onClose={mockOnClose}
          seller={mockSellerWithAllContacts}
          cardTitle="Charizard Base Set"
          cardPrice={299.99}
        />
      )

      expect(screen.getByText('Regarding:')).toBeInTheDocument()
      expect(screen.getByText('Charizard Base Set')).toBeInTheDocument()
      expect(screen.getByText('$299.99')).toBeInTheDocument()
    })

    it('should close modal when close button is clicked', () => {
      render(
        <ContactSellerModal
          isOpen={true}
          onClose={mockOnClose}
          seller={mockSellerWithAllContacts}
          cardTitle="Test Card"
          cardPrice={29.99}
        />
      )

      fireEvent.click(screen.getByRole('button', { name: /close/i }))
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should close modal when X button is clicked', () => {
      render(
        <ContactSellerModal
          isOpen={true}
          onClose={mockOnClose}
          seller={mockSellerWithAllContacts}
          cardTitle="Test Card"
          cardPrice={29.99}
        />
      )

      const closeButtons = screen.getAllByRole('button')
      const xButton = closeButtons.find(button => 
        button.querySelector('svg') && !button.textContent?.includes('Copy')
      )
      
      if (xButton) {
        fireEvent.click(xButton)
        expect(mockOnClose).toHaveBeenCalledTimes(1)
      }
    })
  })

  describe('when seller has all contact methods enabled', () => {
    it('should display all contact methods', () => {
      render(
        <ContactSellerModal
          isOpen={true}
          onClose={mockOnClose}
          seller={mockSellerWithAllContacts}
          cardTitle="Test Card"
          cardPrice={29.99}
        />
      )

      expect(screen.getByText('Available Contact Methods:')).toBeInTheDocument()
      expect(screen.getByText('Email (Preferred)')).toBeInTheDocument()
      expect(screen.getByText('Phone')).toBeInTheDocument()
      expect(screen.getByText('Discord')).toBeInTheDocument()
      expect(screen.getByText('Telegram')).toBeInTheDocument()
    })

    it('should highlight preferred contact method', () => {
      render(
        <ContactSellerModal
          isOpen={true}
          onClose={mockOnClose}
          seller={mockSellerWithAllContacts}
          cardTitle="Test Card"
          cardPrice={29.99}
        />
      )

      expect(screen.getByText('Email (Preferred)')).toBeInTheDocument()
    })

    it('should display contact values', () => {
      render(
        <ContactSellerModal
          isOpen={true}
          onClose={mockOnClose}
          seller={mockSellerWithAllContacts}
          cardTitle="Test Card"
          cardPrice={29.99}
        />
      )

      expect(screen.getByText('john@example.com')).toBeInTheDocument()
      expect(screen.getByText('+1-555-123-4567')).toBeInTheDocument()
      expect(screen.getByText('johndoe#1234')).toBeInTheDocument()
      expect(screen.getByText('@johndoe')).toBeInTheDocument()
    })

    it('should display contact note when provided', () => {
      render(
        <ContactSellerModal
          isOpen={true}
          onClose={mockOnClose}
          seller={mockSellerWithAllContacts}
          cardTitle="Test Card"
          cardPrice={29.99}
        />
      )

      expect(screen.getByText("Seller's Note:")).toBeInTheDocument()
      expect(screen.getByText('Available weekdays 9-5 EST')).toBeInTheDocument()
    })

    it('should display sample message', () => {
      render(
        <ContactSellerModal
          isOpen={true}
          onClose={mockOnClose}
          seller={mockSellerWithAllContacts}
          cardTitle="Charizard"
          cardPrice={199.99}
        />
      )

      expect(screen.getByText('💡 Sample Message:')).toBeInTheDocument()
      expect(screen.getByText(/Hi! I'm interested in your "Charizard" listed for \$199.99/)).toBeInTheDocument()
    })
  })

  describe('when seller has no contact information available', () => {
    it('should display no contact information message', () => {
      render(
        <ContactSellerModal
          isOpen={true}
          onClose={mockOnClose}
          seller={mockSellerWithNoContacts}
          cardTitle="Test Card"
          cardPrice={29.99}
        />
      )

      expect(screen.getByText('No contact information available')).toBeInTheDocument()
      expect(screen.getByText("The seller hasn't provided any public contact information yet.")).toBeInTheDocument()
    })

    it('should not display available contact methods section', () => {
      render(
        <ContactSellerModal
          isOpen={true}
          onClose={mockOnClose}
          seller={mockSellerWithNoContacts}
          cardTitle="Test Card"
          cardPrice={29.99}
        />
      )

      expect(screen.queryByText('Available Contact Methods:')).not.toBeInTheDocument()
    })
  })

  describe('when seller has contact info but privacy disabled', () => {
    it('should display no contact information message even when data exists', () => {
      render(
        <ContactSellerModal
          isOpen={true}
          onClose={mockOnClose}
          seller={mockSellerWithPrivateContacts}
          cardTitle="Test Card"
          cardPrice={29.99}
        />
      )

      expect(screen.getByText('No contact information available')).toBeInTheDocument()
      expect(screen.queryByText('bob@example.com')).not.toBeInTheDocument()
      expect(screen.queryByText('Available Contact Methods:')).not.toBeInTheDocument()
    })
  })

  describe('copy to clipboard functionality', () => {
    it('should copy contact information to clipboard', async () => {
      render(
        <ContactSellerModal
          isOpen={true}
          onClose={mockOnClose}
          seller={mockSellerWithAllContacts}
          cardTitle="Test Card"
          cardPrice={29.99}
        />
      )

      const copyButtons = screen.getAllByText(/copy/i)
      fireEvent.click(copyButtons[0])

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('john@example.com')
      })
    })

    it('should show "Copied!" feedback after copying', async () => {
      render(
        <ContactSellerModal
          isOpen={true}
          onClose={mockOnClose}
          seller={mockSellerWithAllContacts}
          cardTitle="Test Card"
          cardPrice={29.99}
        />
      )

      const copyButtons = screen.getAllByText(/copy/i)
      fireEvent.click(copyButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument()
      })
    })

    it('should copy sample message to clipboard', async () => {
      render(
        <ContactSellerModal
          isOpen={true}
          onClose={mockOnClose}
          seller={mockSellerWithAllContacts}
          cardTitle="Test Card"
          cardPrice={29.99}
        />
      )

      const copyMessageButton = screen.getByText(/copy message/i)
      fireEvent.click(copyMessageButton)

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          'Hi! I\'m interested in your "Test Card" listed for $29.99. Is it still available? Thanks!'
        )
      })
    })
  })

  describe('external links', () => {
    it('should have correct mailto link for email', () => {
      render(
        <ContactSellerModal
          isOpen={true}
          onClose={mockOnClose}
          seller={mockSellerWithAllContacts}
          cardTitle="Test Card"
          cardPrice={29.99}
        />
      )

      const emailLinks = screen.getAllByText('Open')
      const emailLink = emailLinks[0].closest('a')
      expect(emailLink).toHaveAttribute('href', 'mailto:john@example.com?subject=Interested in Test Card - $29.99')
    })

    it('should have correct tel link for phone', () => {
      render(
        <ContactSellerModal
          isOpen={true}
          onClose={mockOnClose}
          seller={mockSellerWithAllContacts}
          cardTitle="Test Card"
          cardPrice={29.99}
        />
      )

      const phoneLinks = screen.getAllByText('Open')
      const phoneLink = phoneLinks[1].closest('a')
      expect(phoneLink).toHaveAttribute('href', 'tel:+1-555-123-4567')
    })

    it('should have correct Telegram link', () => {
      render(
        <ContactSellerModal
          isOpen={true}
          onClose={mockOnClose}
          seller={mockSellerWithAllContacts}
          cardTitle="Test Card"
          cardPrice={29.99}
        />
      )

      const telegramLinks = screen.getAllByText('Open')
      const telegramLink = telegramLinks[2].closest('a')
      expect(telegramLink).toHaveAttribute('href', 'https://t.me/johndoe')
    })

    it('should open external links in new tab', () => {
      render(
        <ContactSellerModal
          isOpen={true}
          onClose={mockOnClose}
          seller={mockSellerWithAllContacts}
          cardTitle="Test Card"
          cardPrice={29.99}
        />
      )

      const externalLinks = screen.getAllByText('Open')
      externalLinks.forEach(link => {
        const anchorElement = link.closest('a')
        expect(anchorElement).toHaveAttribute('target', '_blank')
        expect(anchorElement).toHaveAttribute('rel', 'noopener noreferrer')
      })
    })
  })

  describe('safety reminders', () => {
    it('should display trade safely section', () => {
      render(
        <ContactSellerModal
          isOpen={true}
          onClose={mockOnClose}
          seller={mockSellerWithAllContacts}
          cardTitle="Test Card"
          cardPrice={29.99}
        />
      )

      expect(screen.getByText('Trade Safely')).toBeInTheDocument()
      expect(screen.getByText('• Meet in public places for local trades')).toBeInTheDocument()
      expect(screen.getByText('• Use secure payment methods (PayPal G&S, etc.)')).toBeInTheDocument()
      expect(screen.getByText('• Verify card condition before completing purchase')).toBeInTheDocument()
      expect(screen.getByText("• Trust your instincts - if something feels off, don't proceed")).toBeInTheDocument()
    })
  })

  describe('seller name handling', () => {
    it('should display name when available', () => {
      render(
        <ContactSellerModal
          isOpen={true}
          onClose={mockOnClose}
          seller={mockSellerWithAllContacts}
          cardTitle="Test Card"
          cardPrice={29.99}
        />
      )

      expect(screen.getByText('Contact John Doe')).toBeInTheDocument()
    })

    it('should display username when name is not available', () => {
      const sellerWithUsernameOnly = {
        ...mockSellerWithAllContacts,
        name: null,
        username: 'testuser'
      }

      render(
        <ContactSellerModal
          isOpen={true}
          onClose={mockOnClose}
          seller={sellerWithUsernameOnly}
          cardTitle="Test Card"
          cardPrice={29.99}
        />
      )

      expect(screen.getByText('Contact testuser')).toBeInTheDocument()
    })

    it('should display "Anonymous Seller" when neither name nor username available', () => {
      const anonymousSeller = {
        ...mockSellerWithAllContacts,
        name: null,
        username: null
      }

      render(
        <ContactSellerModal
          isOpen={true}
          onClose={mockOnClose}
          seller={anonymousSeller}
          cardTitle="Test Card"
          cardPrice={29.99}
        />
      )

      expect(screen.getByText('Contact Anonymous Seller')).toBeInTheDocument()
    })
  })

  describe('partial contact information', () => {
    it('should only show enabled contact methods', () => {
      const partialContactSeller = {
        ...mockSellerWithAllContacts,
        contactPhone: null,
        contactTelegram: null,
        showPhone: false,
        showTelegram: false,
        preferredContactMethod: 'discord'
      }

      render(
        <ContactSellerModal
          isOpen={true}
          onClose={mockOnClose}
          seller={partialContactSeller}
          cardTitle="Test Card"
          cardPrice={29.99}
        />
      )

      expect(screen.getByText('Discord (Preferred)')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.queryByText('Phone')).not.toBeInTheDocument()
      expect(screen.queryByText('Telegram')).not.toBeInTheDocument()
    })
  })

  describe('error handling', () => {
    it('should handle clipboard write errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      ;(navigator.clipboard.writeText as jest.Mock).mockRejectedValueOnce(new Error('Clipboard error'))

      render(
        <ContactSellerModal
          isOpen={true}
          onClose={mockOnClose}
          seller={mockSellerWithAllContacts}
          cardTitle="Test Card"
          cardPrice={29.99}
        />
      )

      const copyButtons = screen.getAllByText(/copy/i)
      fireEvent.click(copyButtons[0])

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to copy:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })
  })
})