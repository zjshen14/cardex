import Image from 'next/image'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { parseImageUrls } from '@/lib/imageUtils'

interface Card {
  id: string
  title: string
  price: number
  imageUrls: string | string[]
  condition: string
  category: string
  seller: {
    id: string
    name: string | null
    username: string | null
  }
}

interface CardItemProps {
  card: Card
}

export function CardItem({ card }: CardItemProps) {
  const formatCondition = (condition: string) => {
    return condition.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
  }

  // Parse imageUrls using utility function that handles both SQLite and PostgreSQL
  const imageUrls = parseImageUrls(card.imageUrls)
  const firstImageUrl = imageUrls.length > 0 ? imageUrls[0] : null

  // Get seller display name
  const sellerName = card.seller.name || card.seller.username || 'Anonymous'

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
      <Link href={`/cards/${card.id}`}>
        <div className="relative">
          {firstImageUrl ? (
            <div className="w-full h-48 relative rounded-t-lg overflow-hidden">
              <Image
                src={firstImageUrl}
                alt={card.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />
            </div>
          ) : (
            <div className="w-full h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
              <span className="text-gray-500">No Image</span>
            </div>
          )}
          <button className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50">
            <Heart className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </Link>
      
      <div className="p-4">
        <Link href={`/cards/${card.id}`}>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600">
            {card.title}
          </h3>
        </Link>
        
        <div className="flex justify-between items-center mb-2">
          <span className="text-2xl font-bold text-blue-600">
            ${card.price.toFixed(2)}
          </span>
          <span className="text-sm text-gray-500">
            {formatCondition(card.condition)}
          </span>
        </div>
        
        <div className="text-sm text-gray-600 mb-2">
          {card.category}
        </div>
        
        <div className="text-sm text-gray-500">
          Sold by {sellerName}
        </div>
        
        <Link href={`/cards/${card.id}`}>
          <button className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
            View Details
          </button>
        </Link>
      </div>
    </div>
  )
}