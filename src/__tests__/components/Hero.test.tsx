import { render, screen } from '@testing-library/react'
import { Hero } from '@/components/Hero'

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => {
    return <a href={href} className={className}>{children}</a>
  }
})

describe('Hero', () => {
  it('should render hero section with title and description', () => {
    render(<Hero />)

    expect(screen.getByRole('heading', { name: 'The Ultimate Card Marketplace' })).toBeInTheDocument()
    expect(screen.getByText(/Buy, sell, and trade collectible cards with collectors worldwide/)).toBeInTheDocument()
    expect(screen.getByText(/Discover rare finds and build your dream collection/)).toBeInTheDocument()
  })

  it('should render Start Browsing button', () => {
    render(<Hero />)

    const startBrowsingButton = screen.getByRole('button', { name: 'Start Browsing' })
    expect(startBrowsingButton).toBeInTheDocument()
    expect(startBrowsingButton).toHaveClass('bg-white', 'text-blue-600')
  })

  it('should render Sell Your Cards link with correct href', () => {
    render(<Hero />)

    const sellYourCardsLink = screen.getByRole('link', { name: 'Sell Your Cards' })
    expect(sellYourCardsLink).toBeInTheDocument()
    expect(sellYourCardsLink).toHaveAttribute('href', '/sell')
  })

  it('should have proper styling for Sell Your Cards link', () => {
    render(<Hero />)

    const sellYourCardsLink = screen.getByRole('link', { name: 'Sell Your Cards' })
    expect(sellYourCardsLink).toHaveClass('border-2')
    expect(sellYourCardsLink).toHaveClass('border-white')
    expect(sellYourCardsLink).toHaveClass('text-white')
    expect(sellYourCardsLink).toHaveClass('px-8')
    expect(sellYourCardsLink).toHaveClass('py-3')
    expect(sellYourCardsLink).toHaveClass('rounded-lg')
    expect(sellYourCardsLink).toHaveClass('font-semibold')
    expect(sellYourCardsLink).toHaveClass('transition-colors')
    expect(sellYourCardsLink).toHaveClass('inline-block')
    expect(sellYourCardsLink).toHaveClass('text-center')
  })

  it('should have proper layout structure', () => {
    render(<Hero />)

    // Check for gradient background container
    const heroContainer = document.querySelector('.bg-gradient-to-r')
    expect(heroContainer).toBeInTheDocument()
    expect(heroContainer).toHaveClass('from-blue-600', 'to-blue-800', 'text-white')

    // Check for button container
    const buttonContainer = document.querySelector('.flex.flex-col.sm\\:flex-row')
    expect(buttonContainer).toBeInTheDocument()
    expect(buttonContainer).toHaveClass('gap-4', 'justify-center')
  })
})