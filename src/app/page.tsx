import { CardGrid } from '@/components/CardGrid'
import { Hero } from '@/components/Hero'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Hero />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Featured Cards</h2>
          <div className="flex space-x-4 mb-6">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              All Categories
            </button>
            <button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">
              Trading Cards
            </button>
            <button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">
              Sports Cards
            </button>
            <button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">
              Gaming Cards
            </button>
          </div>
        </div>
        <CardGrid />
      </div>
    </div>
  )
}
