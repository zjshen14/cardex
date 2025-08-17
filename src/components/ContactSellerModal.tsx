'use client'

import { useState } from 'react'
import { X, Mail, Phone, MessageCircle, Send, Copy, ExternalLink, Shield } from 'lucide-react'

interface ContactInfo {
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

interface Seller {
  id: string
  name: string | null
  username: string | null
}

interface ContactSellerModalProps {
  isOpen: boolean
  onClose: () => void
  seller: Seller & ContactInfo
  cardTitle: string
  cardPrice: number
}

export function ContactSellerModal({ 
  isOpen, 
  onClose, 
  seller, 
  cardTitle, 
  cardPrice 
}: ContactSellerModalProps) {
  const [copiedText, setCopiedText] = useState<string | null>(null)

  if (!isOpen) return null

  const sellerName = seller.name || seller.username || 'Anonymous Seller'

  const availableContacts = [
    {
      type: 'email',
      label: 'Email',
      value: seller.contactEmail,
      show: seller.showEmail,
      icon: Mail,
      href: `mailto:${seller.contactEmail}?subject=Interested in ${cardTitle} - $${cardPrice}`,
      copyText: seller.contactEmail
    },
    {
      type: 'phone',
      label: 'Phone',
      value: seller.contactPhone,
      show: seller.showPhone,
      icon: Phone,
      href: `tel:${seller.contactPhone}`,
      copyText: seller.contactPhone
    },
    {
      type: 'discord',
      label: 'Discord',
      value: seller.contactDiscord,
      show: seller.showDiscord,
      icon: MessageCircle,
      href: null,
      copyText: seller.contactDiscord
    },
    {
      type: 'telegram',
      label: 'Telegram',
      value: seller.contactTelegram,
      show: seller.showTelegram,
      icon: Send,
      href: `https://t.me/${seller.contactTelegram?.replace('@', '')}`,
      copyText: seller.contactTelegram
    }
  ].filter(contact => contact.show && contact.value)


  const preferredContact = availableContacts.find(
    contact => contact.type === seller.preferredContactMethod
  )

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(type)
      setTimeout(() => setCopiedText(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const sampleMessage = `Hi! I'm interested in your "${cardTitle}" listed for $${cardPrice}. Is it still available? Thanks!`

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Contact {sellerName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Card Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-1">Regarding:</h3>
            <p className="text-gray-700">{cardTitle}</p>
            <p className="text-blue-600 font-semibold">${cardPrice.toFixed(2)}</p>
          </div>

          {/* No Contact Info Available */}
          {availableContacts.length === 0 && (
            <div className="text-center py-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">
                  <strong>No contact information available</strong>
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  The seller hasn&apos;t provided any public contact information yet.
                </p>
              </div>
            </div>
          )}

          {/* Available Contact Methods */}
          {availableContacts.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Available Contact Methods:</h3>
              
              {/* Preferred Contact (if set) */}
              {preferredContact && (
                <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <preferredContact.icon className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="font-medium text-blue-900">
                      {preferredContact.label} (Preferred)
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <code className="bg-white px-2 py-1 rounded text-sm flex-1">
                      {preferredContact.value}
                    </code>
                    <button
                      onClick={() => handleCopy(preferredContact.copyText!, preferredContact.type)}
                      className="px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      {copiedText === preferredContact.type ? 'Copied!' : 'Copy'}
                    </button>
                    {preferredContact.href && (
                      <a
                        href={preferredContact.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Open
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Other Contact Methods */}
              {availableContacts
                .filter(contact => contact !== preferredContact)
                .map((contact) => (
                  <div key={contact.type} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <contact.icon className="h-5 w-5 text-gray-600 mr-2" />
                      <span className="font-medium text-gray-900">{contact.label}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1">
                        {contact.value}
                      </code>
                      <button
                        onClick={() => handleCopy(contact.copyText!, contact.type)}
                        className="px-2 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 flex items-center"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        {copiedText === contact.type ? 'Copied!' : 'Copy'}
                      </button>
                      {contact.href && (
                        <a
                          href={contact.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Open
                        </a>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Contact Note */}
          {seller.contactNote && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Seller&apos;s Note:</h4>
              <p className="text-blue-800 text-sm">{seller.contactNote}</p>
            </div>
          )}

          {/* Sample Message */}
          {availableContacts.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">💡 Sample Message:</h4>
              <div className="bg-white border rounded p-3 text-sm text-gray-700">
                {sampleMessage}
              </div>
              <button
                onClick={() => handleCopy(sampleMessage, 'message')}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                <Copy className="h-3 w-3 mr-1" />
                {copiedText === 'message' ? 'Copied message!' : 'Copy message'}
              </button>
            </div>
          )}

          {/* Safety Reminder */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <Shield className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900 mb-1">Trade Safely</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Meet in public places for local trades</li>
                  <li>• Use secure payment methods (PayPal G&S, etc.)</li>
                  <li>• Verify card condition before completing purchase</li>
                  <li>• Trust your instincts - if something feels off, don&apos;t proceed</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}