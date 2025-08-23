'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, Trash2, User, ArrowLeft } from 'lucide-react'
import { LoadingModal } from '@/components/LoadingModal'
import { ConfirmDialog } from '@/components/ConfirmDialog'

interface WatchlistItem {
  id: string
  cardId: string
  createdAt: string
  card: {
    id: string
    title: string
    description: string | null
    condition: string
    price: number
    imageUrls: string | string[]
    category: string
    seller: {
      id: string
      name: string | null
      username: string | null
    }
  }
}

export default function WatchlistPage() {
  const { data: session, status } = useSession()
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<string | null>(null)

  useEffect(() => {
    const fetchWatchlist = async () => {
      if (status === 'loading') return
      if (!session) {
        setLoading(false)
        return
      }

      try {
        setError(null)
        const response = await fetch('/api/watchlist')
        
        if (!response.ok) {
          throw new Error('Failed to fetch watchlist')
        }
        
        const data = await response.json()
        setWatchlist(data)
      } catch (error) {
        console.error('Error fetching watchlist:', error)
        setError(error instanceof Error ? error.message : 'Failed to load watchlist')
      } finally {
        setLoading(false)
      }
    }

    fetchWatchlist()
  }, [session, status])

  const handleRemoveFromWatchlist = async (cardId: string) => {
    setRemovingId(cardId)
    try {
      const response = await fetch('/api/watchlist', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cardId }),
      })

      if (response.ok) {
        setWatchlist(prev => prev.filter(item => item.cardId !== cardId))
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to remove card from watchlist')
      }
    } catch (error) {
      console.error('Remove from watchlist error:', error)
      alert('Failed to remove card from watchlist')
    } finally {
      setRemovingId(null)
      setShowRemoveConfirm(null)
    }
  }

  const formatCondition = (condition: string) => {
    return condition.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
  }

  const getImageUrls = (imageUrls: string | string[]): string[] => {
    if (!imageUrls) return []
    
    // Handle both development (JSON string) and production (array) formats
    if (Array.isArray(imageUrls)) {
      return imageUrls
    }
    
    try {
      return JSON.parse(imageUrls)
    } catch {
      return []
    }
  }

  const getSellerName = (seller: { name: string | null; username: string | null }) => {
    return seller.name || seller.username || 'Anonymous'
  }

  if (status === 'loading' || loading) {
    return <LoadingModal />
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h1>
            <p className="text-gray-600 mb-8">Please sign in to view your watchlist</p>
            <Link 
              href="/auth/signin" 
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
              {error}
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="text-blue-600 hover:text-blue-800"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <LoadingModal isOpen={removingId !== null} />
      
      <ConfirmDialog
        isOpen={showRemoveConfirm !== null}
        onConfirm={() => {
          if (showRemoveConfirm) {
            handleRemoveFromWatchlist(showRemoveConfirm)
          }
        }}
        onCancel={() => setShowRemoveConfirm(null)}
        title="Remove from Watchlist"
        message="Are you sure you want to remove this card from your watchlist?"
        confirmText="Remove"
        confirmVariant="danger"
      />

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cards
            </Link>
            
            <div className="flex items-center space-x-3">
              <Heart className="h-8 w-8 text-red-500" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Watchlist</h1>
                <p className="text-gray-600">
                  {watchlist.length === 0 
                    ? 'No cards in your watchlist yet' 
                    : `${watchlist.length} card${watchlist.length === 1 ? '' : 's'} saved`
                  }
                </p>
              </div>
            </div>
          </div>

          {watchlist.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Your watchlist is empty</h2>
              <p className="text-gray-600 mb-8">Start browsing cards and add them to your watchlist to keep track of your favorites</p>
              <Link 
                href="/"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Browse Cards
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {watchlist.map((item) => {
                const imageUrls = getImageUrls(item.card.imageUrls)
                const primaryImage = imageUrls[0] || '/placeholder-card.jpg'
                
                return (
                  <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <Link href={`/cards/${item.card.id}`}>
                      <div className="aspect-square relative">
                        <Image
                          src={primaryImage}
                          alt={item.card.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </Link>
                    
                    <div className="p-4">
                      <Link href={`/cards/${item.card.id}`}>
                        <h3 className="font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors line-clamp-2">
                          {item.card.title}
                        </h3>
                      </Link>
                      
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl font-bold text-blue-600">
                          ${item.card.price.toFixed(2)}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {formatCondition(item.card.condition)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          <span>{getSellerName(item.card.seller)}</span>
                        </div>
                        <span className="text-gray-500">
                          {item.card.category}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                        <span>Added {new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Link 
                          href={`/cards/${item.card.id}`}
                          className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors text-center"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={() => setShowRemoveConfirm(item.cardId)}
                          className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition-colors"
                          title="Remove from watchlist"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}