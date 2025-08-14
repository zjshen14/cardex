'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Edit, Trash2, Eye, DollarSign } from 'lucide-react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { LoadingModal } from '@/components/LoadingModal'
import { EditListingDialog } from '@/components/EditListingDialog'
import { ViewListingModal } from '@/components/ViewListingModal'

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
  isActive: boolean
  createdAt: string
  updatedAt: string
  seller: {
    id: string
    name: string | null
    username: string | null
  }
  transactions: Array<{
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

export default function MyCardsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteCard, setDeleteCard] = useState<Card | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteStatus, setDeleteStatus] = useState<'loading' | 'success' | 'error' | null>(null)
  const [deleteMessage, setDeleteMessage] = useState('')
  const [editCard, setEditCard] = useState<Card | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editStatus, setEditStatus] = useState<'loading' | 'success' | 'error' | null>(null)
  const [editMessage, setEditMessage] = useState('')
  const [viewCard, setViewCard] = useState<Card | null>(null)

  useEffect(() => {
    const fetchMyCards = async () => {
      try {
        const response = await fetch('/api/listings')
        if (!response.ok) {
          throw new Error('Failed to fetch cards')
        }
        const data = await response.json()
        setCards(data)
      } catch (error) {
        console.error('Error fetching cards:', error)
        setError('Failed to load your cards')
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchMyCards()
    }
  }, [session])

  // Redirect if not authenticated
  if (status === 'loading') {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" data-testid="loading-spinner"></div>
    </div>
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

  const formatCondition = (condition: string) => {
    return condition.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'REFUNDED': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleDeleteClick = (card: Card) => {
    setDeleteCard(card)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteCard) return

    setIsDeleting(true)
    setDeleteStatus('loading')
    setDeleteMessage('')
    
    try {
      const response = await fetch(`/api/cards/${deleteCard.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete listing')
      }

      // Remove the deleted card from the list
      setCards(prev => prev.filter(card => card.id !== deleteCard.id))
      setDeleteStatus('success')
      setDeleteMessage('Your listing has been deleted successfully!')
      
      // Close confirmation dialog
      setDeleteCard(null)
      
    } catch (error) {
      console.error('Error deleting card:', error)
      setDeleteStatus('error')
      setDeleteMessage(error instanceof Error ? error.message : 'Failed to delete listing')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteCard(null)
  }

  const handleDeleteStatusClose = () => {
    setDeleteStatus(null)
    setDeleteMessage('')
  }

  const handleEditClick = (card: Card) => {
    setEditCard(card)
  }

  const handleEditSave = async (cardId: string, formData: { title: string; description: string; condition: string; price: string; category: string; set: string; rarity: string; cardNumber: string; year: string }) => {
    setIsEditing(true)
    setEditStatus('loading')
    setEditMessage('')
    
    try {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update listing')
      }

      const updatedCard = await response.json()

      // Update the card in the list
      setCards(prev => prev.map(card => 
        card.id === cardId ? updatedCard : card
      ))

      setEditStatus('success')
      setEditMessage('Your listing has been updated successfully!')
      
      // Close edit dialog
      setEditCard(null)
      
    } catch (error) {
      console.error('Error updating card:', error)
      setEditStatus('error')
      setEditMessage(error instanceof Error ? error.message : 'Failed to update listing')
    } finally {
      setIsEditing(false)
    }
  }

  const handleEditCancel = () => {
    setEditCard(null)
  }

  const handleEditStatusClose = () => {
    setEditStatus(null)
    setEditMessage('')
  }

  const handleViewClick = (card: Card) => {
    setViewCard(card)
  }

  const handleViewClose = () => {
    setViewCard(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" data-testid="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Listings</h1>
              <p className="text-gray-600 mt-1">Manage your card listings</p>
            </div>
            <button
              onClick={() => router.push('/sell')}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              List New Card
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {cards.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-gray-400 mb-4">
              <DollarSign className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No listings yet</h3>
            <p className="text-gray-600 mb-6">Start selling your collectible cards to reach more buyers.</p>
            <button
              onClick={() => router.push('/sell')}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              List Your First Card
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {cards.map((card) => (
              <div key={card.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{card.title}</h3>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {card.category}
                          </span>
                          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                            {formatCondition(card.condition)}
                          </span>
                          <span className="font-semibold text-lg text-green-600">
                            ${card.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewClick(card)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditClick(card)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-md"
                          title="Edit listing"
                          disabled={isDeleting || isEditing}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(card)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-md"
                          title="Delete listing"
                          disabled={isDeleting || isEditing}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {card.description && (
                      <p className="text-gray-700 mt-3 line-clamp-2">{card.description}</p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
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
                          <span className="text-gray-500">Card #:</span>
                          <p className="font-medium">{card.cardNumber}</p>
                        </div>
                      )}
                      {card.year && (
                        <div>
                          <span className="text-gray-500">Year:</span>
                          <p className="font-medium">{card.year}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-500">
                        Listed on {formatDate(card.createdAt)}
                      </div>
                      <div className="text-sm">
                        {card.transactions && card.transactions.length > 0 ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-600">Latest transaction:</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(card.transactions[0]?.status || '')}`}>
                              {card.transactions[0]?.status}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-600">No transactions yet</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteCard !== null}
        title="Delete Listing"
        message={`Are you sure you want to delete "${deleteCard?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {/* Delete Status Modal */}
      <LoadingModal
        isOpen={deleteStatus !== null}
        status={deleteStatus || 'loading'}
        title="Delete Listing"
        loadingMessage="Deleting your listing..."
        successMessage={deleteMessage}
        errorMessage={deleteMessage}
        onSuccess={handleDeleteStatusClose}
        onError={handleDeleteStatusClose}
        onClose={handleDeleteStatusClose}
      />

      {/* Edit Listing Dialog */}
      <EditListingDialog
        isOpen={editCard !== null}
        card={editCard}
        onClose={handleEditCancel}
        onSave={handleEditSave}
        isLoading={isEditing}
      />

      {/* Edit Status Modal */}
      <LoadingModal
        isOpen={editStatus !== null}
        status={editStatus || 'loading'}
        title="Update Listing"
        loadingMessage="Updating your listing..."
        successMessage={editMessage}
        errorMessage={editMessage}
        onSuccess={handleEditStatusClose}
        onError={handleEditStatusClose}
        onClose={handleEditStatusClose}
      />

      {/* View Listing Modal */}
      <ViewListingModal
        isOpen={viewCard !== null}
        card={viewCard}
        onClose={handleViewClose}
      />
    </div>
  )
}