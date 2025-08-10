'use client'

import { useState, useEffect } from 'react'
import { CardItem } from './CardItem'

interface Card {
  id: string
  title: string
  price: number
  imageUrls: string[]
  condition: string
  category: string
  seller: {
    name: string
  }
}

export function CardGrid() {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data for demo purposes
    const mockCards: Card[] = [
      {
        id: '1',
        title: 'Pikachu Shadowless Base Set',
        price: 299.99,
        imageUrls: ['/placeholder-card.jpg'],
        condition: 'NEAR_MINT',
        category: 'Pokemon',
        seller: { name: 'CardCollector123' }
      },
      {
        id: '2',
        title: 'Black Lotus Alpha',
        price: 15000.00,
        imageUrls: ['/placeholder-card.jpg'],
        condition: 'MINT',
        category: 'Magic: The Gathering',
        seller: { name: 'VintageCards' }
      },
      {
        id: '3',
        title: 'Charizard Base Set Unlimited',
        price: 89.99,
        imageUrls: ['/placeholder-card.jpg'],
        condition: 'EXCELLENT',
        category: 'Pokemon',
        seller: { name: 'PokemonMaster' }
      },
      {
        id: '4',
        title: 'Michael Jordan Rookie Card',
        price: 1200.00,
        imageUrls: ['/placeholder-card.jpg'],
        condition: 'NEAR_MINT',
        category: 'Sports',
        seller: { name: 'SportsCardPro' }
      }
    ]

    // Simulate API call
    setTimeout(() => {
      setCards(mockCards)
      setLoading(false)
    }, 1000)
  }, [])

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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {cards.map((card) => (
        <CardItem key={card.id} card={card} />
      ))}
    </div>
  )
}