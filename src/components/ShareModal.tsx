'use client'

import { useState } from 'react'
import { X, Share2, Copy, CheckCircle } from 'lucide-react'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  card: {
    title: string
    category: string
    price: number
    condition: string
  }
  cardUrl: string
}

export function ShareModal({ isOpen, onClose, card, cardUrl }: ShareModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const formatCondition = (condition: string) => {
    return condition.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
  }

  const shareText = `Check out this ${formatCondition(card.condition)} ${card.category} card: ${card.title} for $${card.price.toFixed(2)}!`
  const shareTitle = `${card.title} - ${card.category} Card`

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: cardUrl
        })
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error sharing:', error)
        }
      }
    }
  }

  const handleTwitterShare = () => {
    const tweetText = encodeURIComponent(shareText)
    const tweetUrl = encodeURIComponent(cardUrl)
    const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`
    window.open(twitterUrl, '_blank', 'width=550,height=420')
  }

  const handleRedditShare = () => {
    const redditTitle = encodeURIComponent(shareTitle)
    const redditUrl = encodeURIComponent(cardUrl)
    const redditSubmitUrl = `https://reddit.com/submit?url=${redditUrl}&title=${redditTitle}`
    window.open(redditSubmitUrl, '_blank', 'width=800,height=600')
  }

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(cardUrl)}`
    window.open(facebookUrl, '_blank', 'width=626,height=436')
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(cardUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = cardUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
          <div className="absolute right-0 top-0 pr-4 pt-4">
            <button
              type="button"
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
              <Share2 className="h-6 w-6 text-blue-600" aria-hidden="true" />
            </div>
            
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
              <h3 className="text-lg font-semibold leading-6 text-gray-900">
                Share Card
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Share this {card.category} card with others
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-5 space-y-3">
            {/* Native Share (Mobile) */}
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={handleNativeShare}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share via device
              </button>
            )}
            
            {/* Social Media Options */}
            <div className="space-y-2">
              <button
                onClick={handleTwitterShare}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Share on X
              </button>
              
              <button
                onClick={handleRedditShare}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                </svg>
                Share on Reddit
              </button>
              
              <button
                onClick={handleFacebookShare}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Share on Facebook
              </button>
            </div>
            
            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className={`w-full flex items-center justify-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                copied
                  ? 'border-green-300 bg-green-50 text-green-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Link copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy link
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}