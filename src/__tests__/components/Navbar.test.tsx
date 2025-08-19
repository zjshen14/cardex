import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession, signOut } from 'next-auth/react'
import { Navbar } from '@/components/Navbar'

// Mock next-auth
jest.mock('next-auth/react')
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
  MockLink.displayName = 'Link'
  return MockLink
})

describe('Navbar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render logo and search bar', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated'
    })

    render(<Navbar />)

    expect(screen.getByText('CardEx')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search cards...')).toBeInTheDocument()
  })

  it('should show sign in/up buttons when not authenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated'
    })

    render(<Navbar />)

    expect(screen.getByText('Sign In')).toBeInTheDocument()
    expect(screen.getByText('Sign Up')).toBeInTheDocument()
  })

  it('should show user menu when authenticated', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User'
        },
        expires: '2025-01-01'
      },
      status: 'authenticated'
    })

    render(<Navbar />)

    expect(screen.getByText('Sell Cards')).toBeInTheDocument()
    expect(screen.queryByText('Sign In')).not.toBeInTheDocument()
    expect(screen.queryByText('Sign Up')).not.toBeInTheDocument()
  })

  it('should show dropdown menu on hover', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User'
        },
        expires: '2025-01-01'
      },
      status: 'authenticated'
    })

    render(<Navbar />)

    // Find the user button by its container with group class
    const userButtonContainer = document.querySelector('.group')
    expect(userButtonContainer).toBeInTheDocument()
    
    // Hover over the user button container
    fireEvent.mouseEnter(userButtonContainer!)

    // Check if dropdown items appear
    await waitFor(() => {
      expect(screen.getByText('Profile')).toBeInTheDocument()
      expect(screen.getByText('My Listings')).toBeInTheDocument()
      expect(screen.getByText('Sign Out')).toBeInTheDocument()
    })
  })

  it('should call signOut when Sign Out is clicked', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User'
        },
        expires: '2025-01-01'
      },
      status: 'authenticated'
    })

    render(<Navbar />)

    // Hover to show dropdown
    const userButtonContainer = document.querySelector('.group')
    fireEvent.mouseEnter(userButtonContainer!)

    await waitFor(() => {
      expect(screen.getByText('Sign Out')).toBeInTheDocument()
    })

    // Click sign out
    fireEvent.click(screen.getByText('Sign Out'))

    expect(mockSignOut).toHaveBeenCalled()
  })

  it('should show loading state', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading'
    })

    render(<Navbar />)

    expect(screen.getByTestId || screen.getByRole('button')).toBeTruthy()
    // Should show loading indicator
    const loadingElement = document.querySelector('.animate-pulse')
    expect(loadingElement).toBeInTheDocument()
  })
})