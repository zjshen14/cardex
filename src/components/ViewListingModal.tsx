'use client'

import Image from 'next/image'
import { X, Calendar, DollarSign, Tag, Star, Hash, Trophy, User } from 'lucide-react'

interface Card {
  id: string
  title: string
  description: string | null
  condition: string
  price: number
  category: string
  set: string | null
  rarity: string | null
  cardNumber: string | null
  year: number | null
  imageUrls: string
  status: string
  createdAt: string
  updatedAt: string
  seller: {
    id: string
    name: string | null
    username: string | null
  }
  transactions?: Array<{
    id: string
    status: string
    amount: number
    createdAt: string
    buyer: {
      name: string | null
      username: string | null
    }
  }>
}

interface ViewListingModalProps {
  isOpen: boolean
  card: Card | null
  onClose: () => void
}

export function ViewListingModal({ isOpen, card, onClose }: ViewListingModalProps) {
  if (!isOpen || !card) return null

  const formatCondition = (condition: string) => {
    return condition.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getConditionColor = (condition: string) => {
    const colors = {
      'MINT': 'bg-green-100 text-green-800',
      'NEAR_MINT': 'bg-green-100 text-green-700',
      'EXCELLENT': 'bg-blue-100 text-blue-800',
      'GOOD': 'bg-yellow-100 text-yellow-800',
      'LIGHT_PLAYED': 'bg-orange-100 text-orange-800',
      'PLAYED': 'bg-red-100 text-red-700',
      'POOR': 'bg-gray-100 text-gray-800'
    }
    return colors[condition as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getTransactionStatusColor = (status: string) => {
    const colors = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
      'REFUNDED': 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  let imageUrls: string[] = []
  try {
    imageUrls = typeof card.imageUrls === 'string' ? JSON.parse(card.imageUrls) : card.imageUrls
  } catch {
    imageUrls = []
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl" role="dialog" aria-modal="true">
          {/* Header */}
          <div className="bg-white px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {card.title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <span className="sr-only">Close</span>
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Price and Status */}
            <div className="mt-2 flex items-center space-x-4">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-green-600 mr-1" />
                <span className="text-2xl font-bold text-green-600">{card.price.toFixed(2)}</span>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConditionColor(card.condition)}`}>
                {formatCondition(card.condition)}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                card.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                card.status === 'SOLD' ? 'bg-red-100 text-red-800' :
                card.status === 'ARCHIVED' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {card.status === 'ACTIVE' ? 'Active' :
                 card.status === 'SOLD' ? 'Sold' :
                 card.status === 'ARCHIVED' ? 'Archived' :
                 card.status === 'DELETED' ? 'Deleted' : 'Unknown'}
              </span>
            </div>
          </div>

          <div className="bg-white px-6 py-6 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Images and Description */}
              <div className="space-y-6">
                {/* Images */}
                {imageUrls.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Images</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {imageUrls.slice(0, 4).map((url, index) => (
                        <div key={index} className="relative aspect-square">
                          <Image
                            src={url}
                            alt={`${card.title} - Image ${index + 1}`}
                            fill
                            className="object-cover rounded-lg border"
                            unoptimized
                          />
                        </div>
                      ))}
                    </div>
                    {imageUrls.length > 4 && (
                      <p className="text-sm text-gray-500 mt-2">+{imageUrls.length - 4} more images</p>
                    )}
                  </div>
                )}

                {/* Description */}
                {card.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                    <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                      {card.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column - Details */}
              <div className="space-y-6">
                {/* Card Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Card Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Tag className="h-4 w-4 text-gray-400 mr-3" />
                      <span className="text-sm text-gray-600 w-20">Category:</span>
                      <span className="text-sm font-medium text-gray-900">{card.category}</span>
                    </div>
                    
                    {card.set && (
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-gray-400 mr-3" />
                        <span className="text-sm text-gray-600 w-20">Set:</span>
                        <span className="text-sm font-medium text-gray-900">{card.set}</span>
                      </div>
                    )}
                    
                    {card.rarity && (
                      <div className="flex items-center">
                        <Trophy className="h-4 w-4 text-gray-400 mr-3" />
                        <span className="text-sm text-gray-600 w-20">Rarity:</span>
                        <span className="text-sm font-medium text-gray-900">{card.rarity}</span>
                      </div>
                    )}
                    
                    {card.cardNumber && (
                      <div className="flex items-center">
                        <Hash className="h-4 w-4 text-gray-400 mr-3" />
                        <span className="text-sm text-gray-600 w-20">Number:</span>
                        <span className="text-sm font-medium text-gray-900">{card.cardNumber}</span>
                      </div>
                    )}
                    
                    {card.year && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                        <span className="text-sm text-gray-600 w-20">Year:</span>
                        <span className="text-sm font-medium text-gray-900">{card.year}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Seller Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Seller</h3>
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-sm font-medium text-gray-900">
                      {card.seller.name || card.seller.username || 'Anonymous Seller'}
                    </span>
                  </div>
                </div>

                {/* Listing Dates */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Listing Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                      <span className="text-sm text-gray-600 w-24">Listed on:</span>
                      <span className="text-sm font-medium text-gray-900">{formatDate(card.createdAt)}</span>
                    </div>
                    
                    {card.createdAt !== card.updatedAt && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                        <span className="text-sm text-gray-600 w-24">Updated:</span>
                        <span className="text-sm font-medium text-gray-900">{formatDate(card.updatedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Transaction History */}
                {card.transactions && card.transactions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Transaction History</h3>
                    <div className="space-y-3">
                      {card.transactions.slice(0, 3).map((transaction) => (
                        <div key={transaction.id} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTransactionStatusColor(transaction.status)}`}>
                              {transaction.status.toLowerCase().replace('_', ' ')}
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              ${transaction.amount.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <span>
                              Buyer: {transaction.buyer.name || transaction.buyer.username || 'Anonymous'}
                            </span>
                            <span>{formatDate(transaction.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                      {card.transactions.length > 3 && (
                        <p className="text-sm text-gray-500 text-center">
                          +{card.transactions.length - 3} more transactions
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}