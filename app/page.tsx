"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Search, Filter, X, Star, Calendar, User, Clock, TrendingUp, Heart } from "lucide-react"

interface Movie {
  title: string
  year: string
  imdbId: string
  poster?: string
  genre?: string
  director?: string
  imdbRating?: string
  plot?: string
}

interface SearchFilters {
  genre: string
  yearFrom: string
  yearTo: string
  minRating: string
}

export default function EnhancedMovieApp() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Movie[]>([])
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [watchHistory, setWatchHistory] = useState<Movie[]>([])
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([])
  const [recommendedMovies, setRecommendedMovies] = useState<Movie[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  
  const [filters, setFilters] = useState<SearchFilters>({
    genre: "",
    yearFrom: "",
    yearTo: "",
    minRating: ""
  })

  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const searchContainerRef = useRef<HTMLDivElement>(null)

  const genres = [
    "Action", "Adventure", "Animation", "Biography", "Comedy", "Crime", 
    "Documentary", "Drama", "Family", "Fantasy", "Horror", "Music", 
    "Mystery", "Romance", "Sci-Fi", "Sport", "Thriller", "War", "Western"
  ]

  // Load data from memory on component mount
  useEffect(() => {
    const savedHistory = JSON.parse(localStorage?.getItem("movieSearchHistory") || "[]")
    const savedWatchHistory = JSON.parse(localStorage?.getItem("movieWatchHistory") || "[]")
    const savedFavorites = JSON.parse(localStorage?.getItem("movieFavorites") || "[]")
    
    setSearchHistory(savedHistory)
    setWatchHistory(savedWatchHistory)
    setFavorites(savedFavorites)
    
    loadTrendingMovies()
    loadRecommendations(savedWatchHistory)
  }, [])

  const loadTrendingMovies = async () => {
    const trendingQueries = ["marvel", "batman", "star wars", "harry potter", "lord of the rings"]
    const randomQuery = trendingQueries[Math.floor(Math.random() * trendingQueries.length)]
    
    try {
      const response = await fetch(`https://www.omdbapi.com/?s=${randomQuery}&type=movie&apikey=3fb40590`)
      const data = await response.json()
      
      if (data.Response === "True" && data.Search) {
        const movies = data.Search.slice(0, 6).map((movie: any) => ({
          title: movie.Title,
          year: movie.Year,
          imdbId: movie.imdbID,
          poster: movie.Poster !== "N/A" ? movie.Poster : undefined,
        }))
        setTrendingMovies(movies)
      }
    } catch (error) {
      console.error("Failed to load trending movies:", error)
    }
  }

  const loadRecommendations = (watchHistoryData: Movie[]) => {
    if (watchHistoryData.length === 0) return
    
    // Simple recommendation based on genres of watched movies
    const watchedGenres = watchHistoryData
      .map(m => m.genre)
      .filter(Boolean)
      .join(" ")
    
    if (watchedGenres) {
      searchMoviesForRecommendations(watchedGenres)
    }
  }

  const searchMoviesForRecommendations = async (query: string) => {
    try {
      const response = await fetch(`https://www.omdbapi.com/?s=${encodeURIComponent(query)}&type=movie&apikey=3fb40590`)
      const data = await response.json()
      
      if (data.Response === "True" && data.Search) {
        const movies = data.Search.slice(0, 6).map((movie: any) => ({
          title: movie.Title,
          year: movie.Year,
          imdbId: movie.imdbID,
          poster: movie.Poster !== "N/A" ? movie.Poster : undefined,
        }))
        setRecommendedMovies(movies)
      }
    } catch (error) {
      console.error("Failed to load recommendations:", error)
    }
  }

  const saveToHistory = (query: string) => {
    if (query.length < 2) return
    
    const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10)
    setSearchHistory(newHistory)
    localStorage?.setItem("movieSearchHistory", JSON.stringify(newHistory))
  }

  const saveToWatchHistory = (movie: Movie) => {
    const newWatchHistory = [movie, ...watchHistory.filter(m => m.imdbId !== movie.imdbId)].slice(0, 20)
    setWatchHistory(newWatchHistory)
    localStorage?.setItem("movieWatchHistory", JSON.stringify(newWatchHistory))
    
    // Update recommendations based on new watch history
    loadRecommendations(newWatchHistory)
  }

  const toggleFavorite = (imdbId: string) => {
    const newFavorites = favorites.includes(imdbId) 
      ? favorites.filter(id => id !== imdbId)
      : [...favorites, imdbId]
    
    setFavorites(newFavorites)
    localStorage?.setItem("movieFavorites", JSON.stringify(newFavorites))
  }

  const searchMovies = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      setShowAutocomplete(false)
      return
    }

    setIsSearching(true)
    setShowAutocomplete(true)
    saveToHistory(query)

    try {
      const apiKey = "3fb40590"
      let url = `https://www.omdbapi.com/?s=${encodeURIComponent(query)}&type=movie&apikey=${apiKey}`
      
      // Add year filter if specified
      if (filters.yearFrom) {
        url += `&y=${filters.yearFrom}`
      }

      const response = await fetch(url)
      const data = await response.json()

      if (data.Response === "True" && data.Search) {
        let movies = data.Search.map((movie: any) => ({
          title: movie.Title,
          year: movie.Year,
          imdbId: movie.imdbID,
          poster: movie.Poster !== "N/A" ? movie.Poster : undefined,
        }))

        // Get detailed info for filtering
        const detailedMovies = await Promise.all(
          movies.slice(0, 8).map(async (movie) => {
            try {
              const detailResponse = await fetch(`https://www.omdbapi.com/?i=${movie.imdbId}&apikey=${apiKey}`)
              const detailData = await detailResponse.json()
              
              return {
                ...movie,
                genre: detailData.Genre,
                director: detailData.Director,
                imdbRating: detailData.imdbRating,
                plot: detailData.Plot
              }
            } catch {
              return movie
            }
          })
        )

        // Apply filters
        let filteredMovies = detailedMovies

        if (filters.genre) {
          filteredMovies = filteredMovies.filter(movie => 
            movie.genre?.toLowerCase().includes(filters.genre.toLowerCase())
          )
        }

        if (filters.yearFrom && filters.yearTo) {
          filteredMovies = filteredMovies.filter(movie => {
            const year = parseInt(movie.year)
            return year >= parseInt(filters.yearFrom) && year <= parseInt(filters.yearTo)
          })
        }

        if (filters.minRating) {
          filteredMovies = filteredMovies.filter(movie => 
            movie.imdbRating && parseFloat(movie.imdbRating) >= parseFloat(filters.minRating)
          )
        }

        setSearchResults(filteredMovies)
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
    saveToWatchHistory(movie)
  }

  const clearFilters = () => {
    setFilters({
      genre: "",
      yearFrom: "",
      yearTo: "",
      minRating: ""
    })
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const MovieCard = ({ movie, showFavorite = false }: { movie: Movie, showFavorite?: boolean }) => (
    <div 
      className="flex-shrink-0 w-48 cursor-pointer group"
      onClick={() => selectMovie(movie)}
    >
      <div className="relative">
        <img
          src={movie.poster || "/placeholder.svg?height=300&width=200"}
          alt={movie.title}
          className="w-full h-72 object-cover rounded-lg border border-[#444] group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = "/placeholder.svg?height=300&width=200"
          }}
        />
        {showFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleFavorite(movie.imdbId)
            }}
            className="absolute top-2 right-2 p-2 bg-black/70 rounded-full hover:bg-black/90 transition-colors"
          >
            <Heart 
              className={`w-4 h-4 ${favorites.includes(movie.imdbId) ? 'fill-red-500 text-red-500' : 'text-white'}`} 
            />
          </button>
        )}
      </div>
      <div className="mt-3">
        <h3 className="font-semibold text-white text-sm truncate">{movie.title}</h3>
        <p className="text-[#888] text-xs">{movie.year}</p>
        {movie.imdbRating && (
          <div className="flex items-center mt-1">
            <Star className="w-3 h-3 text-yellow-500 mr-1" />
            <span className="text-yellow-500 text-xs">{movie.imdbRating}</span>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] relative overflow-x-hidden">
      {/* Grain texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-[-1]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
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
        <div ref={searchContainerRef} className="relative max-w-2xl mx-auto mb-8 animate-fade-in-up-delay-200">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#666] w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchQuery.length >= 2 && setShowAutocomplete(true)}
              className="w-full pl-12 pr-16 py-4 text-lg border-2 border-[#333] rounded-xl bg-black/80 backdrop-blur-md text-white outline-none transition-all duration-300 focus:border-[#555] focus:bg-black/90 focus:-translate-y-0.5 focus:shadow-2xl placeholder:text-[#666]"
              placeholder="search for movies..."
              autoComplete="off"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-colors ${showFilters ? 'bg-[#555] text-white' : 'text-[#666] hover:text-white hover:bg-[#333]'}`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-6 bg-black/90 border-2 border-[#333] rounded-xl backdrop-blur-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-semibold">Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-[#666] hover:text-white text-sm flex items-center"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#888] mb-2">Genre</label>
                  <select
                    value={filters.genre}
                    onChange={(e) => setFilters({...filters, genre: e.target.value})}
                    className="w-full p-2 bg-black/80 border border-[#444] rounded-lg text-white"
                  >
                    <option value="">All Genres</option>
                    {genres.map(genre => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-[#888] mb-2">Min Rating</label>
                  <select
                    value={filters.minRating}
                    onChange={(e) => setFilters({...filters, minRating: e.target.value})}
                    className="w-full p-2 bg-black/80 border border-[#444] rounded-lg text-white"
                  >
                    <option value="">Any Rating</option>
                    <option value="7">7.0+</option>
                    <option value="8">8.0+</option>
                    <option value="9">9.0+</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-[#888] mb-2">Year From</label>
                  <input
                    type="number"
                    value={filters.yearFrom}
                    onChange={(e) => setFilters({...filters, yearFrom: e.target.value})}
                    placeholder="e.g. 2000"
                    className="w-full p-2 bg-black/80 border border-[#444] rounded-lg text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-[#888] mb-2">Year To</label>
                  <input
                    type="number"
                    value={filters.yearTo}
                    onChange={(e) => setFilters({...filters, yearTo: e.target.value})}
                    placeholder="e.g. 2024"
                    className="w-full p-2 bg-black/80 border border-[#444] rounded-lg text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Autocomplete Dropdown */}
          {showAutocomplete && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-black/95 border-2 border-[#333] rounded-xl backdrop-blur-xl max-h-96 overflow-y-auto z-[9999]">
              {/* Search History */}
              {searchHistory.length > 0 && searchQuery.length === 0 && (
                <div className="p-4 border-b border-[#333]">
                  <div className="flex items-center mb-3 text-[#888]">
                    <Clock className="w-4 h-4 mr-2" />
                    <span className="text-sm">Recent Searches</span>
                  </div>
                  {searchHistory.slice(0, 5).map((query, index) => (
                    <div
                      key={index}
                      onClick={() => setSearchQuery(query)}
                      className="p-2 hover:bg-[#333]/50 rounded cursor-pointer text-[#ccc] text-sm"
                    >
                      {query}
                    </div>
                  ))}
                </div>
              )}

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
                      <div className="text-[#888] text-sm flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {movie.year}
                        {movie.imdbRating && (
                          <>
                            <Star className="w-3 h-3 ml-3 mr-1 text-yellow-500" />
                            <span className="text-yellow-500">{movie.imdbRating}</span>
                          </>
                        )}
                      </div>
                      {movie.genre && (
                        <div className="text-[#666] text-xs mt-1">{movie.genre}</div>
                      )}
                    </div>
                  </div>
                ))
              ) : searchQuery.length >= 2 ? (
                <div className="text-center py-6 text-[#888]">no movies found</div>
              ) : null}
            </div>
          )}
        </div>

        {/* Trending Movies */}
        {!selectedMovie && trendingMovies.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <TrendingUp className="w-5 h-5 mr-3 text-orange-500" />
              <h2 className="text-2xl font-bold text-white">Trending Now</h2>
            </div>
            <div className="flex space-x-4 overflow-x-auto pb-4">
              {trendingMovies.map((movie) => (
                <MovieCard key={movie.imdbId} movie={movie} showFavorite />
              ))}
            </div>
          </div>
        )}

        {/* Recommended Movies */}
        {!selectedMovie && recommendedMovies.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <Heart className="w-5 h-5 mr-3 text-pink-500" />
              <h2 className="text-2xl font-bold text-white">Recommended for You</h2>
            </div>
            <div className="flex space-x-4 overflow-x-auto pb-4">
              {recommendedMovies.map((movie) => (
                <MovieCard key={movie.imdbId} movie={movie} showFavorite />
              ))}
            </div>
          </div>
        )}

        {/* Continue Watching */}
        {!selectedMovie && watchHistory.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <Clock className="w-5 h-5 mr-3 text-blue-500" />
              <h2 className="text-2xl font-bold text-white">Continue Watching</h2>
            </div>
            <div className="flex space-x-4 overflow-x-auto pb-4">
              {watchHistory.slice(0, 6).map((movie) => (
                <MovieCard key={movie.imdbId} movie={movie} showFavorite />
              ))}
            </div>
          </div>
        )}

        {/* Player Container */}
        <div className="bg-black/80 border-2 border-[#333] rounded-2xl p-8 backdrop-blur-xl animate-fade-in-up-delay-400">
          {selectedMovie ? (
            <>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">{selectedMovie.title}</h2>
                  <div className="flex items-center text-[#888] text-sm space-x-4">
                    <span>now playing</span>
                    {selectedMovie.year && (
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {selectedMovie.year}
                      </span>
                    )}
                    {selectedMovie.imdbRating && (
                      <span className="flex items-center text-yellow-500">
                        <Star className="w-4 h-4 mr-1" />
                        {selectedMovie.imdbRating}
                      </span>
                    )}
                  </div>
                  {selectedMovie.genre && (
                    <div className="text-[#666] text-sm mt-1">{selectedMovie.genre}</div>
                  )}
                </div>
                <button
                  onClick={() => toggleFavorite(selectedMovie.imdbId)}
                  className="p-3 bg-black/70 rounded-full hover:bg-black/90 transition-colors"
                >
                  <Heart 
                    className={`w-5 h-5 ${favorites.includes(selectedMovie.imdbId) ? 'fill-red-500 text-red-500' : 'text-white'}`} 
                  />
                </button>
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

        /* Custom scrollbar */
        .overflow-x-auto::-webkit-scrollbar {
          height: 6px;
        }

        .overflow-x-auto::-webkit-scrollbar-track {
          background: #1a1a1a;
        }

        .overflow-x-auto::-webkit-scrollbar-thumb {
          background: #444;
          border-radius: 3px;
        }
      `}</style>
    </div>
  )
}
