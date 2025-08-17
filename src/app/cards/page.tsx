'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Filter } from 'lucide-react'
import { CardGrid } from '@/components/CardGrid'

const categories = [
  'All Categories',
  'Trading Cards', 
  'Sports Cards',
  'Gaming Cards',
  'Pokemon',
  'Magic: The Gathering',
  'Yu-Gi-Oh!',
  'Baseball',
  'Basketball',
  'Football',
  'Hockey'
]

export default function CardsPage() {
  const searchParams = useSearchParams()
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('category') || 'All Categories'
  )
  const [showFilters, setShowFilters] = useState(false)

  // Update category when URL changes
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category')
    if (categoryFromUrl && categoryFromUrl !== selectedCategory) {
      setSelectedCategory(categoryFromUrl)
    }
  }, [searchParams, selectedCategory])

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    // Update URL without full page reload
    const newUrl = category === 'All Categories' 
      ? '/cards'
      : `/cards?category=${encodeURIComponent(category)}`
    window.history.pushState({}, '', newUrl)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse All Cards</h1>
              <p className="text-gray-600">
                {selectedCategory === 'All Categories' 
                  ? 'Discover cards from all categories'
                  : `Showing cards in ${selectedCategory}`
                }
              </p>
            </div>
            
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 mt-4"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className={`mb-8 ${showFilters ? 'block' : 'hidden sm:block'}`}>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cards Grid */}
        <CardGrid 
          category={selectedCategory === 'All Categories' ? undefined : selectedCategory}
        />

        {/* Back to Top */}
        <div className="mt-12 text-center">
          <Link 
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Featured Cards
          </Link>
        </div>
      </div>
    </div>
  )
}