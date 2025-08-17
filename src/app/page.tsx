import Link from 'next/link'
import { CardGrid } from '@/components/CardGrid'
import { Hero } from '@/components/Hero'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Hero />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Featured Cards</h2>
              <p className="text-gray-600">Most valuable cards from the last 7 days</p>
            </div>
            <Link 
              href="/cards"
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              View All Cards
            </Link>
          </div>
        </div>
        <CardGrid featured={true} limit={8} />
        
        {/* Browse More Section */}
        <div className="mt-12 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Discover More Cards</h3>
          <p className="text-gray-600 mb-6">Browse our complete collection by category or explore all listings</p>
          <div className="flex justify-center space-x-4">
            <Link 
              href="/cards?category=Trading Cards"
              className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Trading Cards
            </Link>
            <Link 
              href="/cards?category=Sports Cards"
              className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Sports Cards
            </Link>
            <Link 
              href="/cards?category=Gaming Cards"
              className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Gaming Cards
            </Link>
            <Link 
              href="/cards"
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Browse All
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
