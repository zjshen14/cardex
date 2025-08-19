/**
 * Profile Page Component Tests
 * 
 * Key testing strategies:
 * 1. Mock all external dependencies properly
 * 2. Test async operations with proper awaiting
 * 3. Handle multiple instances of text by being specific
 * 4. Mock fetch globally for consistent behavior
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ProfilePage from '@/app/profile/page'

// Mock dependencies
jest.mock('next-auth/react')
jest.mock('next/navigation')

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockPush = jest.fn()
const mockUpdate = jest.fn()

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

const mockProfileData = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  username: 'testuser',
  createdAt: '2023-01-01T00:00:00.000Z',
  contactEmail: '',
  contactPhone: '',
  contactDiscord: '',
  contactTelegram: '',
  preferredContactMethod: '',
  contactNote: '',
  showEmail: false,
  showPhone: false,
  showDiscord: false,
  showTelegram: false,
  _count: {
    cards: 5,
    sales: 2,
    watchlist: 4
  }
}

describe('Profile Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn()
    })
  })

  it('should show loading spinner when session is loading', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: mockUpdate
    })

    render(<ProfilePage />)

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('should redirect to signin when unauthenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: mockUpdate
    })

    render(<ProfilePage />)

    expect(mockPush).toHaveBeenCalledWith('/auth/signin')
  })

  it('should render profile information when authenticated and data loaded', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: 'user-123', email: 'test@example.com' }
      },
      status: 'authenticated',
      update: mockUpdate
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockProfileData)
    })

    await act(async () => {
      render(<ProfilePage />)
    })

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })

    expect(screen.getByText('testuser')).toBeInTheDocument()
    // Check for member since text (date format may vary by timezone)
    expect(screen.getByText(/Member since/)).toBeInTheDocument()
    
    // Check activity statistics
    expect(screen.getByText('Cards Listed')).toBeInTheDocument()
    expect(screen.getByText('Cards Sold')).toBeInTheDocument()
    expect(screen.getByText('Watchlist Items')).toBeInTheDocument()
  })

  it('should show "Not set" for empty profile fields', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: 'user-123', email: 'test@example.com' }
      },
      status: 'authenticated',
      update: mockUpdate
    })

    const profileWithNulls = {
      ...mockProfileData,
      name: null,
      username: null
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(profileWithNulls)
    })

    await act(async () => {
      render(<ProfilePage />)
    })

    await waitFor(() => {
      expect(screen.getByText('Anonymous User')).toBeInTheDocument()
    })

    expect(screen.getAllByText('Not set')).toHaveLength(6) // name, username, and 4 contact fields
  })

  it('should enter edit mode when Edit Profile button is clicked', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: 'user-123', email: 'test@example.com' }
      },
      status: 'authenticated',
      update: mockUpdate
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockProfileData)
    })

    await act(async () => {
      render(<ProfilePage />)
    })

    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Edit Profile'))
    })

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
      expect(screen.getByDisplayValue('testuser')).toBeInTheDocument()
      expect(screen.getByText('Save Changes')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })
  })

  it('should cancel edit mode and restore original values', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: 'user-123', email: 'test@example.com' }
      },
      status: 'authenticated',
      update: mockUpdate
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockProfileData)
    })

    await act(async () => {
      render(<ProfilePage />)
    })

    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Edit Profile'))
    })

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
    })

    // Change values
    await act(async () => {
      fireEvent.change(screen.getByDisplayValue('Test User'), {
        target: { value: 'Changed Name' }
      })
    })

    // Cancel
    await act(async () => {
      fireEvent.click(screen.getByText('Cancel'))
    })

    await waitFor(() => {
      // Should show original value, not the changed one
      expect(screen.queryByDisplayValue('Changed Name')).not.toBeInTheDocument()
      expect(screen.getByText('Edit Profile')).toBeInTheDocument()
    })
  })

  it('should save profile changes successfully', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: 'user-123', email: 'test@example.com' }
      },
      status: 'authenticated',
      update: mockUpdate
    })

    const updatedProfile = {
      ...mockProfileData,
      name: 'Updated Name',
      username: 'updateduser'
    }

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProfileData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updatedProfile)
      })

    await act(async () => {
      render(<ProfilePage />)
    })

    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Edit Profile'))
    })

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
    })

    // Change values
    await act(async () => {
      fireEvent.change(screen.getByDisplayValue('Test User'), {
        target: { value: 'Updated Name' }
      })
      fireEvent.change(screen.getByDisplayValue('testuser'), {
        target: { value: 'updateduser' }
      })
    })

    // Save
    await act(async () => {
      fireEvent.click(screen.getByText('Save Changes'))
    })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Updated Name',
          username: 'updateduser',
          contactEmail: '',
          contactPhone: '',
          contactDiscord: '',
          contactTelegram: '',
          preferredContactMethod: '',
          contactNote: '',
          showEmail: false,
          showPhone: false,
          showDiscord: false,
          showTelegram: false
        })
      })
    })

    expect(mockUpdate).toHaveBeenCalled()
  })

  it('should handle save errors', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: 'user-123', email: 'test@example.com' }
      },
      status: 'authenticated',
      update: mockUpdate
    })

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProfileData)
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Username is already taken' })
      })

    await act(async () => {
      render(<ProfilePage />)
    })

    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Edit Profile'))
    })

    await waitFor(() => {
      expect(screen.getByDisplayValue('testuser')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.change(screen.getByDisplayValue('testuser'), {
        target: { value: 'takenuser' }
      })
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Save Changes'))
    })

    await waitFor(() => {
      expect(screen.getAllByText('Username is already taken')).toHaveLength(2) // Modal and page error
    }, { timeout: 15000 })
  }, 20000)

  it('should show error when profile fails to load', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: 'user-123', email: 'test@example.com' }
      },
      status: 'authenticated',
      update: mockUpdate
    })

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Profile not found' })
    })

    await act(async () => {
      render(<ProfilePage />)
    })

    await waitFor(() => {
      expect(screen.getByText('Profile Not Found')).toBeInTheDocument()
      expect(screen.getByText('Failed to load profile')).toBeInTheDocument()
    })
  })

  it('should handle network errors when loading profile', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: 'user-123', email: 'test@example.com' }
      },
      status: 'authenticated',
      update: mockUpdate
    })

    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    await act(async () => {
      render(<ProfilePage />)
    })

    await waitFor(() => {
      expect(screen.getByText('Profile Not Found')).toBeInTheDocument()
      expect(screen.getByText('Failed to load profile')).toBeInTheDocument()
    })
  })
})