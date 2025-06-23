"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Search } from "lucide-react"

interface Movie {
  title: string
  year: string
  imdbId: string
  poster?: string
}

export default function MovieStreamingApp() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Movie[]>([])
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const searchContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const searchMovies = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      setShowAutocomplete(false)
      return
    }

    setIsSearching(true)
    setShowAutocomplete(true)

    try {
      const apiKey = "6138ba16"
      const response = await fetch(
        `https://www.omdbapi.com/?s=${encodeURIComponent(query)}&type=movie&apikey=${apiKey}`,
      )
      const data = await response.json()

      if (data.Response === "True" && data.Search) {
        const movies = data.Search.slice(0, 8).map((movie: any) => ({
          title: movie.Title,
          year: movie.Year,
          imdbId: movie.imdbID,
          poster: movie.Poster !== "N/A" ? movie.Poster : undefined,
        }))
        setSearchResults(movies)
      } else {
        setSearchResults([])
      }
    } catch (error) {
      setSearchResults([])
    }

    setIsSearching(false)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchMovies(query)
    }, 300)
  }

  const selectMovie = (movie: Movie) => {
    setSelectedMovie(movie)
    setSearchQuery(movie.title)
    setShowAutocomplete(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowAutocomplete(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] relative overflow-x-hidden">
      {/* Grain texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-[-1]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in-up">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-br from-white to-[#a0a0a0] bg-clip-text text-transparent tracking-tight">
            movie time
          </h1>
          <p className="text-[#888] text-lg font-normal">search and stream movies instantly</p>
          <div className="mt-4 opacity-60 hover:opacity-100 transition-opacity duration-300">
            <a href="https://qou2.xyz" className="text-[#666] hover:text-white text-sm transition-colors duration-300">
              ← back to qou2.xyz
            </a>
          </div>
        </div>

        {/* Search Container */}
        <div ref={searchContainerRef} className="relative max-w-2xl mx-auto mb-96 animate-fade-in-up-delay-200">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#666] w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              onFocus={() => searchQuery.length >= 2 && setShowAutocomplete(true)}
              className="w-full pl-12 pr-6 py-4 text-lg border-2 border-[#333] rounded-xl bg-black/80 backdrop-blur-md text-white outline-none transition-all duration-300 focus:border-[#555] focus:bg-black/90 focus:-translate-y-0.5 focus:shadow-2xl placeholder:text-[#666]"
              placeholder="search for movies..."
              autoComplete="off"
            />
          </div>

          {/* Autocomplete Dropdown */}
          {showAutocomplete && (
            <div className="absolute top-full left-0 right-0 bg-black/95 border-2 border-[#333] border-t-0 rounded-b-xl backdrop-blur-xl max-h-96 overflow-y-auto z-[99999] shadow-2xl">
              {isSearching ? (
                <div className="text-center py-6 text-[#888] animate-pulse">searching...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map((movie) => (
                  <div
                    key={movie.imdbId}
                    onClick={() => selectMovie(movie)}
                    className="flex items-center p-4 cursor-pointer border-b border-[#333] last:border-b-0 hover:bg-[#333]/50 hover:translate-x-1 transition-all duration-200"
                  >
                    <img
                      src={movie.poster || "/placeholder.svg?height=75&width=50"}
                      alt={movie.title}
                      className="w-12 h-18 object-cover rounded border border-[#444] mr-4"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = "/placeholder.svg?height=75&width=50"
                      }}
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-white mb-1">{movie.title}</div>
                      <div className="text-[#888] text-sm">{movie.year}</div>
                    </div>
                  </div>
                ))
              ) : searchQuery.length >= 2 ? (
                <div className="text-center py-6 text-[#888]">no movies found</div>
              ) : null}
            </div>
          )}
        </div>

        {/* Player Container */}
        <div className="bg-black/80 border-2 border-[#333] rounded-2xl p-8 backdrop-blur-xl animate-fade-in-up-delay-400">
          {selectedMovie ? (
            <>
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-white mb-2">{selectedMovie.title}</h2>
                <p className="text-[#888] text-sm">now playing</p>
              </div>
              <div className="relative w-full pb-[56.25%] rounded-xl overflow-hidden bg-[#111]">
                <iframe
                  src={`https://vidsrc.me/embed/movie?imdb=${selectedMovie.imdbId}`}
                  className="absolute inset-0 w-full h-full border-0"
                  referrerPolicy="origin"
                  allowFullScreen
                  title="Movie Player"
                />
              </div>
            </>
          ) : (
            <div className="relative w-full pb-[56.25%] rounded-xl overflow-hidden bg-[#111] flex items-center justify-center">
              <div className="text-[#666] text-lg">Select a movie to start watching</div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }

        .animate-fade-in-up-delay-200 {
          animation: fade-in-up 0.8s ease-out 0.2s both;
        }

        .animate-fade-in-up-delay-400 {
          animation: fade-in-up 0.8s ease-out 0.4s both;
        }

        .animate-pulse {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
