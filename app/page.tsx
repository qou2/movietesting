"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Search, Filter, X, Star, Calendar, Clock, Heart, Play, Info } from "lucide-react"
import { useDatabase } from "@/hooks/useDatabase"

interface Movie {
  title: string
  year: string
  tmdbId: number
  imdbId?: string
  poster?: string
  backdrop?: string
  genre?: string
  overview?: string
  rating?: number
  releaseDate?: string
  runtime?: number
}

interface SearchFilters {
  genre: string
  yearFrom: string
  yearTo: string
  minRating: string
}

const TMDB_API_KEY = "fd9e39d4ba4a0d878ba369e39793b5f8"
const TMDB_ACCESS_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmZDllMzlkNGJhNGEwZDg3OGJhMzY5ZTM5NzkzYjVmOCIsIm5iZiI6MTc1MDc0NDI3MS41MDIsInN1YiI6IjY4NWEzY2NmODk4NDFiZTJhODRmNmE5ZiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.einV7s-uINbA8P9uXQixNmB9ALAIEjDbhfOXuX4wn5I"
const TMDB_BASE_URL = "https://api.themoviedb.org/3"
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p"

export default function EnhancedMovieApp() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Movie[]>([])
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const { favorites, watchHistory, isLoading, toggleFavorite, addToWatchHistory } = useDatabase()
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [recommendedMovies, setRecommendedMovies] = useState<Movie[]>([])
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([])

  const [filters, setFilters] = useState<SearchFilters>({
    genre: "",
    yearFrom: "",
    yearTo: "",
    minRating: "",
  })

  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const searchContainerRef = useRef<HTMLDivElement>(null)

  const genres = [
    { id: 28, name: "Action" },
    { id: 12, name: "Adventure" },
    { id: 16, name: "Animation" },
    { id: 35, name: "Comedy" },
    { id: 80, name: "Crime" },
    { id: 99, name: "Documentary" },
    { id: 18, name: "Drama" },
    { id: 10751, name: "Family" },
    { id: 14, name: "Fantasy" },
    { id: 27, name: "Horror" },
    { id: 10402, name: "Music" },
    { id: 9648, name: "Mystery" },
    { id: 10749, name: "Romance" },
    { id: 878, name: "Sci-Fi" },
    { id: 53, name: "Thriller" },
    { id: 10752, name: "War" },
    { id: 37, name: "Western" },
  ]

  // Load data and trending movies on component mount
  useEffect(() => {
    loadTrendingMovies()
  }, [])

  useEffect(() => {
    if (!isLoading) {
      loadRecommendations(watchHistory)
    }
  }, [watchHistory, isLoading])

  const loadTrendingMovies = async () => {
    try {
      const response = await fetch(`${TMDB_BASE_URL}/trending/movie/week`, {
        headers: {
          Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      })
      const data = await response.json()

      if (data.results) {
        const movies = data.results.slice(0, 12).map((movie: any) => ({
          title: movie.title,
          year: movie.release_date ? new Date(movie.release_date).getFullYear().toString() : "",
          tmdbId: movie.id,
          poster: movie.poster_path ? `${TMDB_IMAGE_BASE_URL}/w500${movie.poster_path}` : undefined,
          backdrop: movie.backdrop_path ? `${TMDB_IMAGE_BASE_URL}/w1280${movie.backdrop_path}` : undefined,
          overview: movie.overview,
          rating: movie.vote_average,
          releaseDate: movie.release_date,
        }))
        setTrendingMovies(movies)
      }
    } catch (error) {
      console.error("Failed to load trending movies:", error)
    }
  }

  const loadRecommendations = async (watchHistoryData: Movie[]) => {
    if (watchHistoryData.length === 0) {
      // Load popular movies as fallback
      try {
        const response = await fetch(`${TMDB_BASE_URL}/movie/popular`, {
          headers: {
            Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        })
        const data = await response.json()

        if (data.results) {
          const movies = data.results.slice(0, 8).map((movie: any) => ({
            title: movie.title,
            year: movie.release_date ? new Date(movie.release_date).getFullYear().toString() : "",
            tmdbId: movie.id,
            poster: movie.poster_path ? `${TMDB_IMAGE_BASE_URL}/w500${movie.poster_path}` : undefined,
            backdrop: movie.backdrop_path ? `${TMDB_IMAGE_BASE_URL}/w1280${movie.backdrop_path}` : undefined,
            overview: movie.overview,
            rating: movie.vote_average,
            releaseDate: movie.release_date,
          }))
          setRecommendedMovies(movies)
        }
      } catch (error) {
        console.error("Failed to load popular movies:", error)
      }
      return
    }

    // Get recommendations based on watch history
    const lastWatched = watchHistoryData[0]
    if (lastWatched) {
      try {
        const response = await fetch(`${TMDB_BASE_URL}/movie/${lastWatched.tmdbId}/recommendations`, {
          headers: {
            Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        })
        const data = await response.json()

        if (data.results) {
          const movies = data.results.slice(0, 8).map((movie: any) => ({
            title: movie.title,
            year: movie.release_date ? new Date(movie.release_date).getFullYear().toString() : "",
            tmdbId: movie.id,
            poster: movie.poster_path ? `${TMDB_IMAGE_BASE_URL}/w500${movie.poster_path}` : undefined,
            backdrop: movie.backdrop_path ? `${TMDB_IMAGE_BASE_URL}/w1280${movie.backdrop_path}` : undefined,
            overview: movie.overview,
            rating: movie.vote_average,
            releaseDate: movie.release_date,
          }))
          setRecommendedMovies(movies)
        }
      } catch (error) {
        console.error("Failed to load recommendations:", error)
      }
    }
  }

  const saveToHistory = (query: string) => {
    if (query.length < 2) return

    const newHistory = [query, ...searchHistory.filter((h) => h !== query)].slice(0, 10)
    setSearchHistory(newHistory)
  }

  const saveToWatchHistory = (movie: Movie) => {
    addToWatchHistory(movie)
  }

  const handleToggleFavorite = async (movie: Movie) => {
    await toggleFavorite(movie)
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
      let url = `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`

      // Add year filter if specified
      if (filters.yearFrom) {
        url += `&year=${filters.yearFrom}`
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      })
      const data = await response.json()

      if (data.results) {
        const movies = data.results.map((movie: any) => ({
          title: movie.title,
          year: movie.release_date ? new Date(movie.release_date).getFullYear().toString() : "",
          tmdbId: movie.id,
          poster: movie.poster_path ? `${TMDB_IMAGE_BASE_URL}/w500${movie.poster_path}` : undefined,
          backdrop: movie.backdrop_path ? `${TMDB_IMAGE_BASE_URL}/w1280${movie.backdrop_path}` : undefined,
          overview: movie.overview,
          rating: movie.vote_average,
          releaseDate: movie.release_date,
        }))

        // Apply filters
        let filteredMovies = movies

        if (filters.genre) {
          // This would require additional API calls to get genre info for each movie
          // For now, we'll skip this filter in search results
        }

        if (filters.yearFrom && filters.yearTo) {
          filteredMovies = filteredMovies.filter((movie) => {
            const year = Number.parseInt(movie.year)
            return year >= Number.parseInt(filters.yearFrom) && year <= Number.parseInt(filters.yearTo)
          })
        }

        if (filters.minRating) {
          filteredMovies = filteredMovies.filter(
            (movie) => movie.rating && movie.rating >= Number.parseFloat(filters.minRating),
          )
        }

        setSearchResults(filteredMovies.slice(0, 10))
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

  const selectMovie = async (movie: Movie) => {
    // Get detailed movie info
    try {
      const response = await fetch(`${TMDB_BASE_URL}/movie/${movie.tmdbId}`, {
        headers: {
          Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      })
      const detailData = await response.json()

      const detailedMovie = {
        ...movie,
        genre: detailData.genres?.map((g: any) => g.name).join(", "),
        runtime: detailData.runtime,
        imdbId: detailData.imdb_id,
      }

      setSelectedMovie(detailedMovie)
      setSearchQuery(movie.title)
      setShowAutocomplete(false)
      saveToWatchHistory(detailedMovie)
    } catch (error) {
      setSelectedMovie(movie)
      setSearchQuery(movie.title)
      setShowAutocomplete(false)
      saveToWatchHistory(movie)
    }
  }

  const clearFilters = () => {
    setFilters({
      genre: "",
      yearFrom: "",
      yearTo: "",
      minRating: "",
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

  const MovieCard = ({
    movie,
    showFavorite = false,
    size = "normal",
  }: { movie: Movie; showFavorite?: boolean; size?: "normal" | "large" }) => (
    <div
      className={`flex-shrink-0 cursor-pointer group relative ${size === "large" ? "w-64" : "w-48"}`}
      onClick={() => selectMovie(movie)}
    >
      <div className="relative overflow-hidden rounded-xl">
        <img
          src={movie.poster || "/placeholder.svg?height=300&width=200"}
          alt={movie.title}
          className={`w-full object-cover border border-[#333] group-hover:scale-105 transition-all duration-300 ${size === "large" ? "h-96" : "h-72"}`}
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = "/placeholder.svg?height=300&width=200"
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-4 left-4 right-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Play className="w-8 h-8 text-white bg-purple-600 rounded-full p-2" />
              <Info className="w-8 h-8 text-white bg-black/50 rounded-full p-2" />
            </div>
            {showFavorite && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleFavorite(movie)
                }}
                className="p-2 bg-black/70 rounded-full hover:bg-black/90 transition-colors"
              >
                <Heart
                  className={`w-4 h-4 ${favorites.includes(movie.tmdbId) ? "fill-red-500 text-red-500" : "text-white"}`}
                />
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3">
        <h3 className="font-semibold text-white text-sm truncate">{movie.title}</h3>
        <div className="flex items-center justify-between mt-1">
          <p className="text-[#888] text-xs">{movie.year}</p>
          {movie.rating && (
            <div className="flex items-center">
              <Star className="w-3 h-3 text-yellow-500 mr-1" />
              <span className="text-yellow-500 text-xs">{movie.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a0a2e] to-[#0a0a0a] text-[#e0e0e0] relative overflow-x-hidden">
      {/* Grain texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-[-1]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="max-w-7xl mx-auto px-8 py-8 relative">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mr-4">
              <Play className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 bg-clip-text text-transparent tracking-tight">
              movie time
            </h1>
          </div>
          <p className="text-[#888] text-lg font-normal mb-2">powered by videasy • unlimited streaming</p>
          <div className="opacity-60 hover:opacity-100 transition-opacity duration-300">
            <a
              href="https://qou2.xyz"
              className="text-[#666] hover:text-purple-400 text-sm transition-colors duration-300"
            >
              ← back to qou2.xyz
            </a>
          </div>
        </div>

        {/* Search Container */}
        <div ref={searchContainerRef} className="relative max-w-2xl mx-auto mb-12 animate-fade-in-up-delay-200 z-50">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchQuery.length >= 2 && setShowAutocomplete(true)}
              className="w-full pl-12 pr-16 py-4 text-lg border-2 border-purple-500/30 rounded-2xl bg-black/60 backdrop-blur-xl text-white outline-none transition-all duration-300 focus:border-purple-500 focus:bg-black/80 focus:-translate-y-1 focus:shadow-2xl focus:shadow-purple-500/20 placeholder:text-[#666] relative z-10"
              placeholder="search for movies..."
              autoComplete="off"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-xl transition-all duration-300 z-10 ${showFilters ? "bg-purple-600 text-white" : "text-[#666] hover:text-white hover:bg-purple-600/20"}`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-6 bg-black/80 border-2 border-purple-500/30 rounded-2xl backdrop-blur-xl relative z-50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-semibold">Advanced Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-[#666] hover:text-white text-sm flex items-center transition-colors"
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
                    onChange={(e) => setFilters({ ...filters, genre: e.target.value })}
                    className="w-full p-3 bg-black/60 border border-purple-500/30 rounded-xl text-white focus:border-purple-500 transition-colors"
                  >
                    <option value="">All Genres</option>
                    {genres.map((genre) => (
                      <option key={genre.id} value={genre.name}>
                        {genre.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-[#888] mb-2">Min Rating</label>
                  <select
                    value={filters.minRating}
                    onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
                    className="w-full p-3 bg-black/60 border border-purple-500/30 rounded-xl text-white focus:border-purple-500 transition-colors"
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
                    onChange={(e) => setFilters({ ...filters, yearFrom: e.target.value })}
                    placeholder="e.g. 2000"
                    className="w-full p-3 bg-black/60 border border-purple-500/30 rounded-xl text-white focus:border-purple-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#888] mb-2">Year To</label>
                  <input
                    type="number"
                    value={filters.yearTo}
                    onChange={(e) => setFilters({ ...filters, yearTo: e.target.value })}
                    placeholder="e.g. 2024"
                    className="w-full p-3 bg-black/60 border border-purple-500/30 rounded-xl text-white focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Autocomplete Dropdown */}
          {showAutocomplete && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-black/95 border-2 border-purple-500/30 rounded-2xl backdrop-blur-xl max-h-96 overflow-y-auto z-[100]">
              {/* Search History */}
              {searchHistory.length > 0 && searchQuery.length === 0 && (
                <div className="p-4 border-b border-purple-500/20">
                  <div className="flex items-center mb-3 text-purple-400">
                    <Clock className="w-4 h-4 mr-2" />
                    <span className="text-sm">Recent Searches</span>
                  </div>
                  {searchHistory.slice(0, 5).map((query, index) => (
                    <div
                      key={index}
                      onClick={() => setSearchQuery(query)}
                      className="p-2 hover:bg-purple-600/20 rounded-xl cursor-pointer text-[#ccc] text-sm transition-colors"
                    >
                      {query}
                    </div>
                  ))}
                </div>
              )}

              {isSearching ? (
                <div className="text-center py-6 text-purple-400 animate-pulse">searching...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map((movie) => (
                  <div
                    key={movie.tmdbId}
                    onClick={() => selectMovie(movie)}
                    className="flex items-center p-4 cursor-pointer border-b border-purple-500/20 last:border-b-0 hover:bg-purple-600/20 hover:translate-x-1 transition-all duration-200"
                  >
                    <img
                      src={movie.poster || "/placeholder.svg?height=75&width=50"}
                      alt={movie.title}
                      className="w-12 h-18 object-cover rounded-lg border border-purple-500/30 mr-4"
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
                        {movie.rating && (
                          <>
                            <Star className="w-3 h-3 ml-3 mr-1 text-yellow-500" />
                            <span className="text-yellow-500">{movie.rating.toFixed(1)}</span>
                          </>
                        )}
                      </div>
                      {movie.overview && <div className="text-[#666] text-xs mt-1 line-clamp-2">{movie.overview}</div>}
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
          <div className="mb-12 relative z-10">
            <div className="flex items-center mb-8">
              <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full mr-4"></div>
              <h2 className="text-3xl font-bold text-white">Trending This Week</h2>
            </div>
            <div className="flex space-x-6 overflow-x-auto pb-4">
              {trendingMovies.map((movie) => (
                <MovieCard key={movie.tmdbId} movie={movie} showFavorite size="large" />
              ))}
            </div>
          </div>
        )}

        {/* Recommended Movies */}
        {!selectedMovie && recommendedMovies.length > 0 && (
          <div className="mb-12 relative z-10">
            <div className="flex items-center mb-8">
              <Heart className="w-6 h-6 mr-3 text-pink-500" />
              <h2 className="text-2xl font-bold text-white">
                {watchHistory.length > 0 ? "Recommended for You" : "Popular Movies"}
              </h2>
            </div>
            <div className="flex space-x-4 overflow-x-auto pb-4">
              {recommendedMovies.map((movie) => (
                <MovieCard key={movie.tmdbId} movie={movie} showFavorite />
              ))}
            </div>
          </div>
        )}

        {/* Continue Watching */}
        {!selectedMovie && watchHistory.length > 0 && (
          <div className="mb-12 relative z-10">
            <div className="flex items-center mb-8">
              <Clock className="w-6 h-6 mr-3 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">Continue Watching</h2>
            </div>
            <div className="flex space-x-4 overflow-x-auto pb-4">
              {watchHistory.slice(0, 6).map((movie) => (
                <MovieCard key={movie.tmdbId} movie={movie} showFavorite />
              ))}
            </div>
          </div>
        )}

        {/* Player Container */}
        <div className="bg-black/60 border-2 border-purple-500/30 rounded-3xl p-8 backdrop-blur-xl animate-fade-in-up-delay-400 relative z-10">
          {selectedMovie ? (
            <>
              <div className="flex justify-between items-start mb-8">
                <div className="flex-1">
                  <h2 className="text-4xl font-bold text-white mb-3">{selectedMovie.title}</h2>
                  <div className="flex items-center text-[#888] text-sm space-x-6 mb-4">
                    <span className="px-3 py-1 bg-purple-600/20 rounded-full text-purple-400 text-xs font-medium">
                      NOW PLAYING
                    </span>
                    {selectedMovie.year && (
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {selectedMovie.year}
                      </span>
                    )}
                    {selectedMovie.rating && (
                      <span className="flex items-center text-yellow-500">
                        <Star className="w-4 h-4 mr-1" />
                        {selectedMovie.rating.toFixed(1)}
                      </span>
                    )}
                    {selectedMovie.runtime && (
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {selectedMovie.runtime}min
                      </span>
                    )}
                  </div>
                  {selectedMovie.genre && <div className="text-purple-300 text-sm mb-3">{selectedMovie.genre}</div>}
                  {selectedMovie.overview && (
                    <p className="text-[#ccc] text-sm leading-relaxed max-w-3xl">{selectedMovie.overview}</p>
                  )}
                </div>
                <button
                  onClick={() => handleToggleFavorite(selectedMovie)}
                  className="p-4 bg-black/70 rounded-2xl hover:bg-black/90 transition-all duration-300 hover:scale-105"
                >
                  <Heart
                    className={`w-6 h-6 ${favorites.includes(selectedMovie.tmdbId) ? "fill-red-500 text-red-500" : "text-white"}`}
                  />
                </button>
              </div>
              <div className="relative w-full pb-[56.25%] rounded-2xl overflow-hidden bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/20">
                <iframe
                  src={`https://player.videasy.net/movie/${selectedMovie.tmdbId}`}
                  className="absolute inset-0 w-full h-full border-0 rounded-2xl"
                  allowFullScreen
                  allow="encrypted-media"
                  title="Movie Player"
                />
              </div>
              <div className="mt-6 text-center">
                <p className="text-[#666] text-xs">
                  Powered by <span className="text-purple-400 font-medium">Videasy</span> • Made by qou2
                </p>
              </div>
            </>
          ) : (
            <div className="relative w-full pb-[56.25%] rounded-2xl overflow-hidden bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/20 flex items-center justify-center">
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mb-6">
                  <Play className="w-10 h-10 text-white" />
                </div>
                <div className="text-white text-xl font-semibold mb-2">Ready to Watch?</div>
                <div className="text-[#888] text-lg">Search and select a movie to start streaming</div>
              </div>
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

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Custom scrollbar */
        .overflow-x-auto::-webkit-scrollbar {
          height: 8px;
        }

        .overflow-x-auto::-webkit-scrollbar-track {
          background: rgba(139, 69, 193, 0.1);
          border-radius: 4px;
        }

        .overflow-x-auto::-webkit-scrollbar-thumb {
          background: linear-gradient(90deg, #8b45c1, #ec4899);
          border-radius: 4px;
        }

        .overflow-y-auto::-webkit-scrollbar {
          width: 8px;
        }

        .overflow-y-auto::-webkit-scrollbar-track {
          background: rgba(139, 69, 193, 0.1);
          border-radius: 4px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #8b45c1, #ec4899);
          border-radius: 4px;
        }
      `}</style>
    </div>
  )
}
