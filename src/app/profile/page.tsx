'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { User, Mail, Calendar, Edit2, Save, X, Phone, MessageCircle, Send, Eye, EyeOff } from 'lucide-react'
import { LoadingModal } from '@/components/LoadingModal'

interface UserProfile {
  id: string
  email: string
  name: string | null
  username: string | null
  createdAt: string
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
  _count: {
    cards: number
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
    username: '',
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
          username: data.username || '',
          contactEmail: data.contactEmail || '',
          contactPhone: data.contactPhone || '',
          contactDiscord: data.contactDiscord || '',
          contactTelegram: data.contactTelegram || '',
          preferredContactMethod: data.preferredContactMethod || '',
          contactNote: data.contactNote || '',
          showEmail: data.showEmail || false,
          showPhone: data.showPhone || false,
          showDiscord: data.showDiscord || false,
          showTelegram: data.showTelegram || false
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
      username: profile?.username || '',
      contactEmail: profile?.contactEmail || '',
      contactPhone: profile?.contactPhone || '',
      contactDiscord: profile?.contactDiscord || '',
      contactTelegram: profile?.contactTelegram || '',
      preferredContactMethod: profile?.preferredContactMethod || '',
      contactNote: profile?.contactNote || '',
      showEmail: profile?.showEmail || false,
      showPhone: profile?.showPhone || false,
      showDiscord: profile?.showDiscord || false,
      showTelegram: profile?.showTelegram || false
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setEditForm(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }))
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

                {/* Contact Information */}
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Contact Information
                  </h2>
                  
                  <div className="space-y-4">
                    {/* Contact Email */}
                    <div className="flex items-start">
                      <Mail className="h-5 w-5 text-gray-400 mr-3 mt-1" />
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                        {isEditing ? (
                          <div className="mt-1 space-y-2">
                            <input
                              type="email"
                              name="contactEmail"
                              value={editForm.contactEmail}
                              onChange={handleInputChange}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="your.email@example.com"
                            />
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                name="showEmail"
                                checked={editForm.showEmail}
                                onChange={handleInputChange}
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-600 flex items-center">
                                {editForm.showEmail ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
                                Show to interested buyers
                              </span>
                            </label>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <p className="text-gray-900">{profile.contactEmail || 'Not set'}</p>
                            {profile.showEmail && profile.contactEmail && (
                              <Eye className="h-4 w-4 text-green-500" title="Visible to buyers" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contact Phone */}
                    <div className="flex items-start">
                      <Phone className="h-5 w-5 text-gray-400 mr-3 mt-1" />
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                        {isEditing ? (
                          <div className="mt-1 space-y-2">
                            <input
                              type="tel"
                              name="contactPhone"
                              value={editForm.contactPhone}
                              onChange={handleInputChange}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="+1 (555) 123-4567"
                            />
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                name="showPhone"
                                checked={editForm.showPhone}
                                onChange={handleInputChange}
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-600 flex items-center">
                                {editForm.showPhone ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
                                Show to interested buyers
                              </span>
                            </label>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <p className="text-gray-900">{profile.contactPhone || 'Not set'}</p>
                            {profile.showPhone && profile.contactPhone && (
                              <Eye className="h-4 w-4 text-green-500" title="Visible to buyers" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Discord */}
                    <div className="flex items-start">
                      <MessageCircle className="h-5 w-5 text-gray-400 mr-3 mt-1" />
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">Discord Username</label>
                        {isEditing ? (
                          <div className="mt-1 space-y-2">
                            <input
                              type="text"
                              name="contactDiscord"
                              value={editForm.contactDiscord}
                              onChange={handleInputChange}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="username#1234"
                            />
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                name="showDiscord"
                                checked={editForm.showDiscord}
                                onChange={handleInputChange}
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-600 flex items-center">
                                {editForm.showDiscord ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
                                Show to interested buyers
                              </span>
                            </label>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <p className="text-gray-900">{profile.contactDiscord || 'Not set'}</p>
                            {profile.showDiscord && profile.contactDiscord && (
                              <Eye className="h-4 w-4 text-green-500" title="Visible to buyers" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Telegram */}
                    <div className="flex items-start">
                      <Send className="h-5 w-5 text-gray-400 mr-3 mt-1" />
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">Telegram Handle</label>
                        {isEditing ? (
                          <div className="mt-1 space-y-2">
                            <input
                              type="text"
                              name="contactTelegram"
                              value={editForm.contactTelegram}
                              onChange={handleInputChange}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="@username"
                            />
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                name="showTelegram"
                                checked={editForm.showTelegram}
                                onChange={handleInputChange}
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-600 flex items-center">
                                {editForm.showTelegram ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
                                Show to interested buyers
                              </span>
                            </label>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <p className="text-gray-900">{profile.contactTelegram || 'Not set'}</p>
                            {profile.showTelegram && profile.contactTelegram && (
                              <Eye className="h-4 w-4 text-green-500" title="Visible to buyers" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Preferred Contact Method */}
                    {isEditing && (
                      <div className="flex items-start">
                        <User className="h-5 w-5 text-gray-400 mr-3 mt-1" />
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700">Preferred Contact Method</label>
                          <select
                            name="preferredContactMethod"
                            value={editForm.preferredContactMethod}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select preferred method</option>
                            <option value="email">Email</option>
                            <option value="phone">Phone</option>
                            <option value="discord">Discord</option>
                            <option value="telegram">Telegram</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Contact Note */}
                    <div className="flex items-start">
                      <MessageCircle className="h-5 w-5 text-gray-400 mr-3 mt-1" />
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">Contact Note</label>
                        {isEditing ? (
                          <textarea
                            name="contactNote"
                            value={editForm.contactNote}
                            onChange={handleInputChange}
                            rows={2}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., Available weekdays 9-5 EST, prefer Discord for quick responses"
                          />
                        ) : (
                          <p className="text-gray-900">{profile.contactNote || 'No specific preferences'}</p>
                        )}
                      </div>
                    </div>

                    {!isEditing && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                          💡 <strong>Trading Tip:</strong> Add your contact information to let interested buyers reach you directly. 
                          You control what information is visible to others.
                        </p>
                      </div>
                    )}
                  </div>
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