import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { signIn } from 'next-auth/react'
import SignUpPage from '@/app/auth/signup/page'

// Mock next-auth
jest.mock('next-auth/react')
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>

// Mock fetch
global.fetch = jest.fn()

// Suppress JSDOM navigation warnings
const originalConsoleError = console.error
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (args[0]?.message?.includes('Not implemented: navigation')) {
      return // Suppress JSDOM navigation warnings
    }
    originalConsoleError(...args)
  }
})

afterAll(() => {
  console.error = originalConsoleError
})

describe('SignUp Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(fetch as jest.Mock).mockClear()
  })

  it('should render signup form', () => {
    render(<SignUpPage />)

    expect(screen.getByText('Create your account')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Confirm password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
  })

  it('should show error when passwords do not match', async () => {
    const user = userEvent.setup()
    render(<SignUpPage />)

    await user.type(screen.getByPlaceholderText('Email address'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('Password'), 'password123')
    await user.type(screen.getByPlaceholderText('Confirm password'), 'differentPassword')
    
    await user.click(screen.getByRole('button', { name: /sign up/i }))

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    })
  })

  it('should create account and sign in user successfully', async () => {
    const user = userEvent.setup()
    
    // Mock successful registration
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'User created successfully',
        user: { id: '1', email: 'test@example.com' }
      })
    })

    // Mock successful sign in
    mockSignIn.mockResolvedValueOnce({
      ok: true,
      error: null
    } as any)

    render(<SignUpPage />)

    await user.type(screen.getByPlaceholderText('Email address'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('Password'), 'password123')
    await user.type(screen.getByPlaceholderText('Confirm password'), 'password123')
    
    await user.click(screen.getByRole('button', { name: /sign up/i }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      })
    })

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: 'password123',
        callbackUrl: '/',
        redirect: false,
      })
    })
  })

  it('should show error when registration fails', async () => {
    const user = userEvent.setup()
    
    // Mock failed registration
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'User already exists'
      })
    })

    render(<SignUpPage />)

    await user.type(screen.getByPlaceholderText('Email address'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('Password'), 'password123')
    await user.type(screen.getByPlaceholderText('Confirm password'), 'password123')
    
    await user.click(screen.getByRole('button', { name: /sign up/i }))

    await waitFor(() => {
      expect(screen.getByText('User already exists')).toBeInTheDocument()
    })
  })

  it('should show loading state during signup', async () => {
    const user = userEvent.setup()
    
    // Mock delayed response
    ;(fetch as jest.Mock).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ message: 'User created successfully' })
      }), 100))
    )

    render(<SignUpPage />)

    await user.type(screen.getByPlaceholderText('Email address'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('Password'), 'password123')
    await user.type(screen.getByPlaceholderText('Confirm password'), 'password123')
    
    await user.click(screen.getByRole('button', { name: /sign up/i }))

    // Should show loading state
    expect(screen.getByText('Creating account...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled()
  })
})