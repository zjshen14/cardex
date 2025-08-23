'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Search, User, Heart } from 'lucide-react'

export function Navbar() {
  const { data: session, status } = useSession()

  return (
    <nav className="bg-white shadow-md border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center">
            <div className="text-2xl font-bold text-blue-600">CardEx</div>
          </Link>

          <div className="flex-1 max-w-lg mx-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search cards..."
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            ) : session ? (
              <>
                <Link 
                  href="/watchlist" 
                  className="text-gray-600 hover:text-gray-900 flex items-center space-x-1"
                  title="My Watchlist"
                >
                  <Heart className="h-5 w-5" />
                  <span className="text-sm hidden sm:inline">Watchlist</span>
                </Link>
                <Link href="/sell" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                  Sell Cards
                </Link>
                <div className="relative group">
                  <button className="flex items-center text-gray-600 hover:text-gray-900 p-1">
                    <User className="h-6 w-6" />
                  </button>
                  <div className="absolute right-0 top-full pt-1 w-48 z-10 hidden group-hover:block">
                    <div className="bg-white rounded-md shadow-lg py-1 border">
                      <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Profile
                      </Link>
                      <Link href="/listings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        My Listings
                      </Link>
                      <button
                        onClick={() => signOut()}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={() => signIn()}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2"
                >
                  Sign In
                </button>
                <Link
                  href="/auth/signup"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}