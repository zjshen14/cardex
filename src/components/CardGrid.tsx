'use client'

import { useState, useEffect } from 'react'
import { CardItem } from './CardItem'

interface Card {
  id: string
  title: string
  price: number
  imageUrls: string
  condition: string
  category: string
  seller: {
    id: string
    name: string | null
    username: string | null
  }
}

interface CardGridProps {
  featured?: boolean
  limit?: number
  category?: string
}

export function CardGrid({ featured = false, limit, category }: CardGridProps) {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCards = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Build query parameters
        const params = new URLSearchParams()
        if (featured) params.append('featured', 'true')
        if (limit) params.append('limit', limit.toString())
        if (category) params.append('category', category)
        
        const queryString = params.toString()
        const url = `/api/cards${queryString ? `?${queryString}` : ''}`
        
        const response = await fetch(url)
        
        if (!response.ok) {
          throw new Error('Failed to fetch cards')
        }
        
        const data = await response.json()
        setCards(data)
      } catch (error) {
        console.error('Error fetching cards:', error)
        setError('Failed to load cards. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchCards()
  }, [featured, limit, category])

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
            <div className="w-full h-48 bg-gray-300 rounded mb-4"></div>
            <div className="h-4 bg-gray-300 rounded mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">
          <p className="text-lg font-semibold mb-2">No cards available</p>
          <p>Be the first to list a card!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {cards.map((card) => (
        <CardItem key={card.id} card={card} />
      ))}
    </div>
  )
}