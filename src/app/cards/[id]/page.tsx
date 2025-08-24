'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Heart, Share2, User } from 'lucide-react'
import { ContactSellerModal } from '@/components/ContactSellerModal'
import { ShareModal } from '@/components/ShareModal'

interface Card {
  id: string
  title: string
  description: string | null
  condition: string
  price: number
  imageUrls: string | string[]
  category: string
  set: string | null
  rarity: string | null
  cardNumber: string | null
  year: number | null
  createdAt: string
  seller: {
    id: string
    name: string | null
    username: string | null
    contactEmail: string | null
    contactPhone: string | null
    contactDiscord: string | null
    contactTelegram: string | null
    preferredContactMethod: string | null
    contactNote: string | null
    showEmail: boolean
    showPhone: boolean
    showDiscord: boolean
    showTelegram: boolean
  }
}

export default function CardDetailsPage() {
  const params = useParams()
  const { data: session } = useSession()
  const [card, setCard] = useState<Card | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [showContactModal, setShowContactModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [isInWatchlist, setIsInWatchlist] = useState(false)
  const [watchlistLoading, setWatchlistLoading] = useState(false)

  useEffect(() => {
    const fetchCard = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/cards/${params.id}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Card not found')
          }
          throw new Error('Failed to fetch card details')
        }
        
        const data = await response.json()
        setCard(data)
      } catch (error) {
        console.error('Error fetching card:', error)
        setError(error instanceof Error ? error.message : 'Failed to load card details')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchCard()
    }
  }, [params.id])

  // Check if card is in user's watchlist
  useEffect(() => {
    const checkWatchlistStatus = async () => {
      if (!session || !card) return

      try {
        const response = await fetch('/api/watchlist')
        if (response.ok) {
          const watchlist = await response.json()
          const isWatched = watchlist.some((item: { cardId: string }) => item.cardId === card.id)
          setIsInWatchlist(isWatched)
        }
      } catch (error) {
        console.error('Error checking watchlist status:', error)
      }
    }

    checkWatchlistStatus()
  }, [session, card])

  const handleWatchlistToggle = async () => {
    if (!session || !card) {
      alert('Please sign in to use the watchlist feature')
      return
    }

    setWatchlistLoading(true)
    try {
      const method = isInWatchlist ? 'DELETE' : 'POST'
      const response = await fetch('/api/watchlist', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cardId: card.id }),
      })

      if (response.ok) {
        setIsInWatchlist(!isInWatchlist)
      } else {
        const error = await response.json()
        alert(error.error || `Failed to ${isInWatchlist ? 'remove from' : 'add to'} watchlist`)
      }
    } catch (error) {
      console.error('Watchlist toggle error:', error)
      alert(`Failed to ${isInWatchlist ? 'remove from' : 'add to'} watchlist`)
    } finally {
      setWatchlistLoading(false)
    }
  }

  const formatCondition = (condition: string) => {
    return condition.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
  }

  const getImageUrls = (): string[] => {
    if (!card?.imageUrls) return []
    
    // Handle both development (JSON string) and production (array) formats
    if (Array.isArray(card.imageUrls)) {
      return card.imageUrls
    }
    
    try {
      return JSON.parse(card.imageUrls)
    } catch {
      return []
    }
  }

  const getSellerName = () => {
    if (!card?.seller) return 'Anonymous'
    return card.seller.name || card.seller.username || 'Anonymous'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-32 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-300 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-300 rounded"></div>
                <div className="h-6 bg-gray-300 rounded w-3/4"></div>
                <div className="h-6 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
            <Link 
              href="/"
              className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Homepage
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!card) {
    return null
  }

  const imageUrls = getImageUrls()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isOwner = (session?.user as any)?.id === card.seller.id

  return (
    <>
      {/* Contact Seller Modal */}
      {card && (
        <ContactSellerModal
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
          seller={card.seller}
          cardTitle={card.title}
          cardPrice={card.price}
        />
      )}

      {/* Share Modal */}
      {card && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          card={{
            title: card.title,
            category: card.category,
            price: card.price,
            condition: card.condition
          }}
          cardUrl={typeof window !== 'undefined' ? window.location.href : ''}
        />
      )}

      <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Navigation */}
        <Link 
          href="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cards
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-lg shadow-md overflow-hidden">
              {imageUrls.length > 0 ? (
                <Image
                  src={imageUrls[selectedImageIndex]}
                  alt={card.title}
                  width={600}
                  height={600}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  No Image Available
                </div>
              )}
            </div>
            
            {/* Thumbnail Navigation */}
            {imageUrls.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {imageUrls.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      index === selectedImageIndex
                        ? 'border-blue-500'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={url}
                      alt={`${card.title} ${index + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Card Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{card.title}</h1>
              <div className="flex items-center space-x-4">
                <span className="text-3xl font-bold text-blue-600">
                  ${card.price.toFixed(2)}
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                  {formatCondition(card.condition)}
                </span>
              </div>
            </div>

            {/* Card Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Card Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Category:</span>
                  <p className="font-medium">{card.category}</p>
                </div>
                {card.set && (
                  <div>
                    <span className="text-gray-500">Set:</span>
                    <p className="font-medium">{card.set}</p>
                  </div>
                )}
                {card.rarity && (
                  <div>
                    <span className="text-gray-500">Rarity:</span>
                    <p className="font-medium">{card.rarity}</p>
                  </div>
                )}
                {card.cardNumber && (
                  <div>
                    <span className="text-gray-500">Card Number:</span>
                    <p className="font-medium">{card.cardNumber}</p>
                  </div>
                )}
                {card.year && (
                  <div>
                    <span className="text-gray-500">Year:</span>
                    <p className="font-medium">{card.year}</p>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Listed:</span>
                  <p className="font-medium">
                    {new Date(card.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            {card.description && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{card.description}</p>
              </div>
            )}

            {/* Seller Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Seller Information</h3>
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 rounded-full p-2">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{getSellerName()}</p>
                  <p className="text-sm text-gray-500">Verified Seller</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {!isOwner ? (
                <>
                  <button 
                    onClick={() => setShowContactModal(true)}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Contact Seller
                  </button>
                  <div className="flex space-x-3">
                    <button 
                      onClick={handleWatchlistToggle}
                      disabled={watchlistLoading}
                      className={`flex-1 py-2 px-4 rounded-lg transition-colors flex items-center justify-center border ${
                        isInWatchlist
                          ? 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      } ${watchlistLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Heart className={`h-4 w-4 mr-2 ${isInWatchlist ? 'fill-current' : ''}`} />
                      {watchlistLoading 
                        ? 'Loading...' 
                        : isInWatchlist 
                          ? 'Remove from Watchlist' 
                          : 'Add to Watchlist'
                      }
                    </button>
                    <button 
                      onClick={() => setShowShareModal(true)}
                      className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 text-center">This is your listing</p>
                  <Link href={`/listings`}>
                    <button className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                      Manage Listing
                    </button>
                  </Link>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
      </div>
    </>
  )
}