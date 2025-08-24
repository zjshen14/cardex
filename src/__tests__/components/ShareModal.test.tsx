import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { ShareModal } from '@/components/ShareModal'

// Mock window.open
const mockOpen = jest.fn()
Object.defineProperty(window, 'open', { value: mockOpen })

// Mock navigator.share
const mockShare = jest.fn()
Object.defineProperty(navigator, 'share', {
  value: mockShare,
  configurable: true
})

// Mock navigator.clipboard
const mockWriteText = jest.fn()
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: mockWriteText },
  configurable: true
})

// Mock document.execCommand for fallback copy
const mockExecCommand = jest.fn()
Object.defineProperty(document, 'execCommand', {
  value: mockExecCommand,
  configurable: true
})

describe('ShareModal', () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    card: {
      title: 'Charizard',
      category: 'Pokemon',
      price: 150.00,
      condition: 'NEAR_MINT'
    },
    cardUrl: 'https://cardex.com/cards/123'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('should not render when isOpen is false', () => {
    render(<ShareModal {...mockProps} isOpen={false} />)
    expect(screen.queryByText('Share Card')).not.toBeInTheDocument()
  })

  it('should render share modal when isOpen is true', () => {
    render(<ShareModal {...mockProps} />)
    
    expect(screen.getByText('Share Card')).toBeInTheDocument()
    expect(screen.getByText('Share this Pokemon card with others')).toBeInTheDocument()
    expect(screen.getByText('Share on X')).toBeInTheDocument()
    expect(screen.getByText('Share on Reddit')).toBeInTheDocument()
    expect(screen.getByText('Share on Facebook')).toBeInTheDocument()
    expect(screen.getByText('Copy link')).toBeInTheDocument()
  })

  it('should close modal when clicking close button', () => {
    render(<ShareModal {...mockProps} />)
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)
    
    expect(mockProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('should close modal when clicking backdrop', () => {
    render(<ShareModal {...mockProps} />)
    
    const backdrop = document.querySelector('.fixed.inset-0.bg-gray-500')
    fireEvent.click(backdrop!)
    
    expect(mockProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('should show native share button when navigator.share is available', () => {
    render(<ShareModal {...mockProps} />)
    expect(screen.getByText('Share via device')).toBeInTheDocument()
  })

  it('should call navigator.share when native share button is clicked', async () => {
    mockShare.mockResolvedValue(undefined)
    
    render(<ShareModal {...mockProps} />)
    
    const nativeShareButton = screen.getByText('Share via device')
    fireEvent.click(nativeShareButton)
    
    await waitFor(() => {
      expect(mockShare).toHaveBeenCalledWith({
        title: 'Charizard - Pokemon Card',
        text: 'Check out this Near Mint Pokemon card: Charizard for $150.00!',
        url: 'https://cardex.com/cards/123'
      })
    })
  })

  it('should handle native share errors gracefully', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation()
    mockShare.mockRejectedValue(new Error('Share failed'))
    
    render(<ShareModal {...mockProps} />)
    
    const nativeShareButton = screen.getByText('Share via device')
    fireEvent.click(nativeShareButton)
    
    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Error sharing:', expect.any(Error))
    })
    
    consoleError.mockRestore()
  })

  it('should not log error for AbortError (user cancelled)', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation()
    const abortError = new Error('User cancelled')
    abortError.name = 'AbortError'
    mockShare.mockRejectedValue(abortError)
    
    render(<ShareModal {...mockProps} />)
    
    const nativeShareButton = screen.getByText('Share via device')
    fireEvent.click(nativeShareButton)
    
    await waitFor(() => {
      expect(consoleError).not.toHaveBeenCalled()
    })
    
    consoleError.mockRestore()
  })

  it('should open Twitter share URL when X button is clicked', () => {
    render(<ShareModal {...mockProps} />)
    
    const twitterButton = screen.getByText('Share on X')
    fireEvent.click(twitterButton)
    
    const expectedText = encodeURIComponent('Check out this Near Mint Pokemon card: Charizard for $150.00!')
    const expectedUrl = encodeURIComponent('https://cardex.com/cards/123')
    const expectedTwitterUrl = `https://twitter.com/intent/tweet?text=${expectedText}&url=${expectedUrl}`
    
    expect(mockOpen).toHaveBeenCalledWith(expectedTwitterUrl, '_blank', 'width=550,height=420')
  })

  it('should open Reddit share URL when Reddit button is clicked', () => {
    render(<ShareModal {...mockProps} />)
    
    const redditButton = screen.getByText('Share on Reddit')
    fireEvent.click(redditButton)
    
    const expectedTitle = encodeURIComponent('Charizard - Pokemon Card')
    const expectedUrl = encodeURIComponent('https://cardex.com/cards/123')
    const expectedRedditUrl = `https://reddit.com/submit?url=${expectedUrl}&title=${expectedTitle}`
    
    expect(mockOpen).toHaveBeenCalledWith(expectedRedditUrl, '_blank', 'width=800,height=600')
  })

  it('should open Facebook share URL when Facebook button is clicked', () => {
    render(<ShareModal {...mockProps} />)
    
    const facebookButton = screen.getByText('Share on Facebook')
    fireEvent.click(facebookButton)
    
    const expectedUrl = encodeURIComponent('https://cardex.com/cards/123')
    const expectedFacebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${expectedUrl}`
    
    expect(mockOpen).toHaveBeenCalledWith(expectedFacebookUrl, '_blank', 'width=626,height=436')
  })

  it('should copy link to clipboard when copy button is clicked', async () => {
    mockWriteText.mockResolvedValue(undefined)
    
    render(<ShareModal {...mockProps} />)
    
    const copyButton = screen.getByText('Copy link')
    fireEvent.click(copyButton)
    
    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith('https://cardex.com/cards/123')
      expect(screen.getByText('Link copied!')).toBeInTheDocument()
    })
  })

  it('should show success state after copying link', async () => {
    mockWriteText.mockResolvedValue(undefined)
    
    render(<ShareModal {...mockProps} />)
    
    const copyButton = screen.getByText('Copy link')
    fireEvent.click(copyButton)
    
    await waitFor(() => {
      expect(screen.getByText('Link copied!')).toBeInTheDocument()
    })
    
    // Should revert after 2 seconds
    await waitFor(() => {
      expect(screen.getByText('Copy link')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

})