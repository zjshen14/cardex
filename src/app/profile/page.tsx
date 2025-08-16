'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { User, Mail, Calendar, Edit2, Save, X } from 'lucide-react'
import { LoadingModal } from '@/components/LoadingModal'

interface UserProfile {
  id: string
  email: string
  name: string | null
  username: string | null
  createdAt: string
  _count: {
    cards: number
    purchases: number
    sales: number
    watchlist: number
  }
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [modalStatus, setModalStatus] = useState<'loading' | 'success' | 'error' | null>(null)
  
  const [editForm, setEditForm] = useState({
    name: '',
    username: ''
  })

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/user/profile')
        if (!response.ok) {
          throw new Error('Failed to fetch profile')
        }
        const data = await response.json()
        setProfile(data)
        setEditForm({
          name: data.name || '',
          username: data.username || ''
        })
      } catch (error) {
        console.error('Error fetching profile:', error)
        setError('Failed to load profile')
      } finally {
        setIsLoading(false)
      }
    }

    if (status === 'authenticated') {
      fetchProfile()
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const handleEdit = () => {
    setIsEditing(true)
    setError('')
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditForm({
      name: profile?.name || '',
      username: profile?.username || ''
    })
    setError('')
  }

  const handleSave = async () => {
    setIsSaving(true)
    setModalStatus('loading')
    setError('')

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }

      const updatedProfile = await response.json()
      setProfile(updatedProfile)
      setIsEditing(false)
      setModalStatus('success')

      // Update the session with new user data
      await update({
        ...session,
        user: {
          ...session?.user,
          name: updatedProfile.name,
        }
      })

    } catch (error) {
      console.error('Error updating profile:', error)
      setError(error instanceof Error ? error.message : 'Failed to update profile')
      setModalStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEditForm(prev => ({ ...prev, [name]: value }))
  }

  const handleModalClose = () => {
    setModalStatus(null)
  }

  // Redirect if not authenticated
  if (status === 'loading') {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" data-testid="loading-spinner"></div>
    </div>
  }

  if (status === 'unauthenticated') {
    return null // useEffect will handle the redirect
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" data-testid="loading-spinner"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
              <p className="text-gray-600">Unable to load your profile information.</p>
              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <LoadingModal
        isOpen={modalStatus !== null}
        status={modalStatus || 'loading'}
        title="Updating Profile"
        loadingMessage="Please wait while we update your profile..."
        successMessage="Your profile has been updated successfully!"
        errorMessage={error || "Something went wrong while updating your profile."}
        onSuccess={handleModalClose}
        onError={handleModalClose}
        onClose={handleModalClose}
      />

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-white rounded-full p-3">
                    <User className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h1 className="text-2xl font-bold text-white">
                      {profile.name || 'Anonymous User'}
                    </h1>
                    <p className="text-blue-100">
                      Member since {new Date(profile.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                {!isEditing && (
                  <button
                    onClick={handleEdit}
                    className="bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors flex items-center"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>

            {/* Profile Information */}
            <div className="p-6">
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Personal Information
                  </h2>
                  
                  <div className="space-y-4">
                    {/* Email */}
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <p className="text-gray-900">{profile.email}</p>
                      </div>
                    </div>

                    {/* Name */}
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 mr-3" />
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="name"
                            value={editForm.name}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter your name"
                          />
                        ) : (
                          <p className="text-gray-900">{profile.name || 'Not set'}</p>
                        )}
                      </div>
                    </div>

                    {/* Username */}
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 mr-3" />
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">Username</label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="username"
                            value={editForm.username}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter a username"
                          />
                        ) : (
                          <p className="text-gray-900">{profile.username || 'Not set'}</p>
                        )}
                      </div>
                    </div>

                    {/* Join Date */}
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Member Since</label>
                        <p className="text-gray-900">
                          {new Date(profile.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {isEditing && (
                    <div className="flex space-x-3 pt-4">
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {/* Activity Statistics */}
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Activity Statistics
                  </h2>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{profile._count.cards}</div>
                      <div className="text-sm text-blue-800">Cards Listed</div>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{profile._count.sales}</div>
                      <div className="text-sm text-green-800">Cards Sold</div>
                    </div>
                    
                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">{profile._count.purchases}</div>
                      <div className="text-sm text-purple-800">Cards Bought</div>
                    </div>
                    
                    <div className="bg-orange-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600">{profile._count.watchlist}</div>
                      <div className="text-sm text-orange-800">Watchlist Items</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}