import Link from 'next/link'

export function Hero() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            The Ultimate Card Marketplace
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Buy, sell, and trade collectible cards with collectors worldwide. 
            Discover rare finds and build your dream collection.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/cards"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block text-center"
            >
              Start Browsing
            </Link>
            <Link 
              href="/sell"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors inline-block text-center"
            >
              Sell Your Cards
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}