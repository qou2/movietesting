"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Search, Filter, X, Star, Calendar, Clock, Heart, Play, Info, Tv, Film, User, Lock } from "lucide-react"
import { useDatabase } from "@/hooks/useDatabase"
import SeasonEpisodeSelector from "@/components/season-episode-selector"

interface Media {
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
  mediaType: "movie" | "tv"
  // TV show specific fields
  seasonNumber?: number
  episodeNumber?: number
  totalSeasons?: number
  totalEpisodes?: number
  episodeTitle?: string
  seasonTitle?: string
}

interface SearchFilters {
  genre: string
  yearFrom: string
  yearTo: string
  minRating: string
  mediaType: "all" | "movie" | "tv"
}

const TMDB_API_KEY = "fd9e39d4ba4a0d878ba369e39793b5f8"
const TMDB_ACCESS_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmZDllMzlkNGJhNGEwZDg3OGJhMzY5ZTM5NzkzYjVmOCIsIm5iZiI6MTc1MDc0NDI3MS41MDIsInN1YiI6IjY4NWEzY2NmODk4NDFiZTJhODRmNmE5ZiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.einV7s-uINbA8P9uXQixNmB9ALAIEjDbhfOXuX4wn5I"
const TMDB_BASE_URL = "https://api.themoviedb.org/3"
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p"

export default function EnhancedMovieApp() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Media[]>([])
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const { favorites, watchHistory, isLoading, toggleFavorite, addToWatchHistory } = useDatabase()
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [recommendedMedia, setRecommendedMedia] = useState<Media[]>([])
  const [trendingMedia, setTrendingMedia] = useState<Media[]>([])

  // TV show specific states
  const [selectedSeason, setSelectedSeason] = useState(1)
  const [selectedEpisode, setSelectedEpisode] = useState(1)
  const [selectedEpisodeData, setSelectedEpisodeData] = useState<any>(null)

  const [filters, setFilters] = useState<SearchFilters>({
    genre: "",
    yearFrom: "",
    yearTo: "",
    minRating: "",
    mediaType: "all",
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

  // Helper function to safely parse year from date
  const parseYear = (dateString: string | null | undefined): string => {
    if (!dateString) return ""

    try {
      const date = new Date(dateString)
      const year = date.getFullYear()

      // Check if year is reasonable (between 1900 and current year + 5)
      const currentYear = new Date().getFullYear()
      if (year >= 1900 && year <= currentYear + 5) {
        return year.toString()
      }

      // If full date parsing fails, try to extract year from string
      const yearMatch = dateString.match(/(\d{4})/)
      if (yearMatch) {
        const extractedYear = Number.parseInt(yearMatch[1])
        if (extractedYear >= 1900 && extractedYear <= currentYear + 5) {
          return extractedYear.toString()
        }
      }

      return ""
    } catch (error) {
      console.warn("Error parsing date:", dateString, error)
      return ""
    }
  }

  useEffect(() => {
    // Prevent any stray API calls that might cause errors
    const originalFetch = window.fetch
    window.fetch = function (...args) {
      const url = args[0]
      if (typeof url === "string" && url.includes("generate-access-code")) {
        console.warn("Blocked call to non-existent generate-access-code endpoint")
        return Promise.reject(new Error("Endpoint not available"))
      }
      return originalFetch.apply(this, args)
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [])

  // Load data and trending content on component mount
  useEffect(() => {
    loadTrendingContent()
  }, [])

  useEffect(() => {
    if (!isLoading) {
      loadRecommendations(watchHistory)
    }
  }, [watchHistory, isLoading])

  const loadTrendingContent = async () => {
    try {
      // Load both trending movies and TV shows
      const [moviesResponse, tvResponse] = await Promise.all([
        fetch(`${TMDB_BASE_URL}/trending/movie/week`, {
          headers: {
            Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        }),
        fetch(`${TMDB_BASE_URL}/trending/tv/week`, {
          headers: {
            Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        }),
      ])

      const [moviesData, tvData] = await Promise.all([moviesResponse.json(), tvResponse.json()])

      const allTrending = []

      // Add movies
      if (moviesData.results) {
        const movies = moviesData.results.slice(0, 6).map((movie: any) => ({
          title: movie.title,
          year: parseYear(movie.release_date),
          tmdbId: movie.id,
          poster: movie.poster_path ? `${TMDB_IMAGE_BASE_URL}/w500${movie.poster_path}` : undefined,
          backdrop: movie.backdrop_path ? `${TMDB_IMAGE_BASE_URL}/w1280${movie.backdrop_path}` : undefined,
          overview: movie.overview,
          rating: movie.vote_average,
          releaseDate: movie.release_date,
          mediaType: "movie" as const,
        }))
        allTrending.push(...movies)
      }

      // Add TV shows
      if (tvData.results) {
        const tvShows = tvData.results.slice(0, 6).map((show: any) => ({
          title: show.name,
          year: parseYear(show.first_air_date),
          tmdbId: show.id,
          poster: show.poster_path ? `${TMDB_IMAGE_BASE_URL}/w500${show.poster_path}` : undefined,
          backdrop: show.backdrop_path ? `${TMDB_IMAGE_BASE_URL}/w1280${show.backdrop_path}` : undefined,
          overview: show.overview,
          rating: show.vote_average,
          releaseDate: show.first_air_date,
          mediaType: "tv" as const,
        }))
        allTrending.push(...tvShows)
      }

      // Shuffle and limit
      const shuffled = allTrending.sort(() => 0.5 - Math.random()).slice(0, 12)
      setTrendingMedia(shuffled)
    } catch (error) {
      console.error("Failed to load trending content:", error)
    }
  }

  const loadRecommendations = async (watchHistoryData: Media[]) => {
    if (watchHistoryData.length === 0) {
      // Load popular content as fallback
      try {
        const [moviesResponse, tvResponse] = await Promise.all([
          fetch(`${TMDB_BASE_URL}/movie/popular`, {
            headers: {
              Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
              "Content-Type": "application/json",
            },
          }),
          fetch(`${TMDB_BASE_URL}/tv/popular`, {
            headers: {
              Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
              "Content-Type": "application/json",
            },
          }),
        ])

        const [moviesData, tvData] = await Promise.all([moviesResponse.json(), tvResponse.json()])

        const allPopular = []

        // Add movies
        if (moviesData.results) {
          const movies = moviesData.results.slice(0, 4).map((movie: any) => ({
            title: movie.title,
            year: parseYear(movie.release_date),
            tmdbId: movie.id,
            poster: movie.poster_path ? `${TMDB_IMAGE_BASE_URL}/w500${movie.poster_path}` : undefined,
            backdrop: movie.backdrop_path ? `${TMDB_IMAGE_BASE_URL}/w1280${movie.backdrop_path}` : undefined,
            overview: movie.overview,
            rating: movie.vote_average,
            releaseDate: movie.release_date,
            mediaType: "movie" as const,
          }))
          allPopular.push(...movies)
        }

        // Add TV shows
        if (tvData.results) {
          const tvShows = tvData.results.slice(0, 4).map((show: any) => ({
            title: show.name,
            year: parseYear(show.first_air_date),
            tmdbId: show.id,
            poster: show.poster_path ? `${TMDB_IMAGE_BASE_URL}/w500${show.poster_path}` : undefined,
            backdrop: show.backdrop_path ? `${TMDB_IMAGE_BASE_URL}/w1280${show.backdrop_path}` : undefined,
            overview: show.overview,
            rating: show.vote_average,
            releaseDate: show.first_air_date,
            mediaType: "tv" as const,
          }))
          allPopular.push(...tvShows)
        }

        setRecommendedMedia(allPopular)
      } catch (error) {
        console.error("Failed to load popular content:", error)
      }
      return
    }

    // Get recommendations based on watch history
    const lastWatched = watchHistoryData[0]
    if (lastWatched) {
      try {
        const endpoint = lastWatched.mediaType === "tv" ? "tv" : "movie"
        const response = await fetch(`${TMDB_BASE_URL}/${endpoint}/${lastWatched.tmdbId}/recommendations`, {
          headers: {
            Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        })
        const data = await response.json()

        if (data.results) {
          const recommendations = data.results.slice(0, 8).map((item: any) => ({
            title: item.title || item.name,
            year: parseYear(item.release_date || item.first_air_date),
            tmdbId: item.id,
            poster: item.poster_path ? `${TMDB_IMAGE_BASE_URL}/w500${item.poster_path}` : undefined,
            backdrop: item.backdrop_path ? `${TMDB_IMAGE_BASE_URL}/w1280${item.backdrop_path}` : undefined,
            overview: item.overview,
            rating: item.vote_average,
            releaseDate: item.release_date || item.first_air_date,
            mediaType: lastWatched.mediaType,
          }))
          setRecommendedMedia(recommendations)
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

  const saveToWatchHistory = (media: Media) => {
    addToWatchHistory(media)
  }

  const handleToggleFavorite = async (media: Media) => {
    await toggleFavorite(media)
  }

  const searchContent = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      setShowAutocomplete(false)
      return
    }

    setIsSearching(true)
    setShowAutocomplete(true)
    saveToHistory(query)

    try {
      const searches = []

      // Search movies if not filtering for TV only
      if (filters.mediaType === "all" || filters.mediaType === "movie") {
        searches.push(
          fetch(`${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`, {
            headers: {
              Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
              "Content-Type": "application/json",
            },
          }),
        )
      } else {
        searches.push(Promise.resolve({ json: () => ({ results: [] }) }))
      }

      // Search TV shows if not filtering for movies only
      if (filters.mediaType === "all" || filters.mediaType === "tv") {
        searches.push(
          fetch(`${TMDB_BASE_URL}/search/tv?query=${encodeURIComponent(query)}`, {
            headers: {
              Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
              "Content-Type": "application/json",
            },
          }),
        )
      } else {
        searches.push(Promise.resolve({ json: () => ({ results: [] }) }))
      }

      const [movieResponse, tvResponse] = await Promise.all(searches)
      const [movieData, tvData] = await Promise.all([movieResponse.json(), tvResponse.json()])

      const allResults = []

      // Add movies
      if (movieData.results) {
        const movies = movieData.results.map((movie: any) => ({
          title: movie.title,
          year: parseYear(movie.release_date),
          tmdbId: movie.id,
          poster: movie.poster_path ? `${TMDB_IMAGE_BASE_URL}/w500${movie.poster_path}` : undefined,
          backdrop: movie.backdrop_path ? `${TMDB_IMAGE_BASE_URL}/w1280${movie.backdrop_path}` : undefined,
          overview: movie.overview,
          rating: movie.vote_average,
          releaseDate: movie.release_date,
          mediaType: "movie" as const,
        }))
        allResults.push(...movies)
      }

      // Add TV shows
      if (tvData.results) {
        const tvShows = tvData.results.map((show: any) => ({
          title: show.name,
          year: parseYear(show.first_air_date),
          tmdbId: show.id,
          poster: show.poster_path ? `${TMDB_IMAGE_BASE_URL}/w500${show.poster_path}` : undefined,
          backdrop: show.backdrop_path ? `${TMDB_IMAGE_BASE_URL}/w1280${show.backdrop_path}` : undefined,
          overview: show.overview,
          rating: show.vote_average,
          releaseDate: show.first_air_date,
          mediaType: "tv" as const,
        }))
        allResults.push(...tvShows)
      }

      // Apply filters
      let filteredResults = allResults

      if (filters.yearFrom && filters.yearTo) {
        filteredResults = filteredResults.filter((item) => {
          const year = Number.parseInt(item.year)
          return year >= Number.parseInt(filters.yearFrom) && year <= Number.parseInt(filters.yearTo)
        })
      }

      if (filters.minRating) {
        filteredResults = filteredResults.filter(
          (item) => item.rating && item.rating >= Number.parseFloat(filters.minRating),
        )
      }

      // Sort by popularity (rating * vote count approximation)
      filteredResults.sort((a, b) => (b.rating || 0) - (a.rating || 0))

      setSearchResults(filteredResults.slice(0, 10))
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
      searchContent(query)
    }, 300)
  }

  const selectMedia = async (media: Media) => {
    // Get detailed info
    try {
      const endpoint = media.mediaType === "tv" ? "tv" : "movie"
      const response = await fetch(`${TMDB_BASE_URL}/${endpoint}/${media.tmdbId}`, {
        headers: {
          Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      })
      const detailData = await response.json()

      const detailedMedia = {
        ...media,
        genre: detailData.genres?.map((g: any) => g.name).join(", "),
        runtime: detailData.runtime || detailData.episode_run_time?.[0],
        imdbId: detailData.imdb_id,
        totalSeasons: detailData.number_of_seasons,
        totalEpisodes: detailData.number_of_episodes,
      }

      setSelectedMedia(detailedMedia)
      setSearchQuery(media.title)
      setShowAutocomplete(false)

      // Reset TV show selections
      if (media.mediaType === "tv") {
        setSelectedSeason(1)
        setSelectedEpisode(1)
        setSelectedEpisodeData(null)
      } else {
        saveToWatchHistory(detailedMedia)
      }
    } catch (error) {
      setSelectedMedia(media)
      setSearchQuery(media.title)
      setShowAutocomplete(false)
      if (media.mediaType === "movie") {
        saveToWatchHistory(media)
      }
    }
  }

  const handleEpisodeSelect = (season: number, episode: number, episodeData: any) => {
    setSelectedSeason(season)
    setSelectedEpisode(episode)
    setSelectedEpisodeData(episodeData)

    if (selectedMedia) {
      const episodeMedia = {
        ...selectedMedia,
        seasonNumber: season,
        episodeNumber: episode,
        episodeTitle: episodeData.name,
        runtime: episodeData.runtime,
      }
      saveToWatchHistory(episodeMedia)
    }
  }

  const clearFilters = () => {
    setFilters({
      genre: "",
      yearFrom: "",
      yearTo: "",
      minRating: "",
      mediaType: "all",
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

  const MediaCard = ({
    media,
    showFavorite = false,
    size = "normal",
  }: { media: Media; showFavorite?: boolean; size?: "normal" | "large" }) => (
    <div
      className={`flex-shrink-0 cursor-pointer group relative ${size === "large" ? "w-64" : "w-48"}`}
      onClick={() => selectMedia(media)}
    >
      <div className="relative overflow-hidden rounded-xl">
        <img
          src={media.poster || "/placeholder.svg?height=300&width=200"}
          alt={media.title}
          className={`w-full object-cover border border-[#333] group-hover:scale-105 transition-all duration-300 ${size === "large" ? "h-96" : "h-72"}`}
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = "/placeholder.svg?height=300&width=200"
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Media Type Badge */}
        <div className="absolute top-2 left-2">
          <div
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              media.mediaType === "tv" ? "bg-blue-600/80 text-blue-100" : "bg-purple-600/80 text-purple-100"
            }`}
          >
            {media.mediaType === "tv" ? (
              <div className="flex items-center">
                <Tv className="w-3 h-3 mr-1" />
                TV
              </div>
            ) : (
              <div className="flex items-center">
                <Film className="w-3 h-3 mr-1" />
                Movie
              </div>
            )}
          </div>
        </div>

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
                  handleToggleFavorite(media)
                }}
                className="p-2 bg-black/70 rounded-full hover:bg-black/90 transition-colors"
              >
                <Heart
                  className={`w-4 h-4 ${favorites.includes(media.tmdbId) ? "fill-red-500 text-red-500" : "text-white"}`}
                />
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3">
        <h3 className="font-semibold text-white text-sm truncate">{media.title}</h3>
        <div className="flex items-center justify-between mt-1">
          <p className="text-[#888] text-xs">{media.year}</p>
          {media.rating && (
            <div className="flex items-center">
              <Star className="w-3 h-3 text-yellow-500 mr-1" />
              <span className="text-yellow-500 text-xs">{media.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const getPlayerUrl = () => {
    if (!selectedMedia) return ""

    if (selectedMedia.mediaType === "tv") {
      return `https://player.videasy.net/tv/${selectedMedia.tmdbId}/${selectedSeason}/${selectedEpisode}`
    } else {
      return `https://player.videasy.net/movie/${selectedMedia.tmdbId}`
    }
  }

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

        {/* Navigation Buttons */}
        <div className="flex justify-center space-x-4 mb-8 animate-fade-in-up-delay-100">
          <button
            onClick={() => (window.location.href = "/account")}
            className="bg-black/60 border-2 border-purple-500/30 text-purple-300 px-6 py-3 rounded-xl font-medium hover:bg-purple-600/20 hover:border-purple-500 transition-all duration-300 backdrop-blur-xl flex items-center space-x-2"
          >
            <User className="w-5 h-5" />
            <span>My Account</span>
          </button>
          <button
            onClick={() => (window.location.href = "/admin")}
            className="bg-black/60 border-2 border-red-500/30 text-red-300 px-6 py-3 rounded-xl font-medium hover:bg-red-600/20 hover:border-red-500 transition-all duration-300 backdrop-blur-xl flex items-center space-x-2"
          >
            <Lock className="w-5 h-5" />
            <span>Admin</span>
          </button>
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
              placeholder="search for movies and TV shows..."
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
                  <label className="block text-sm text-[#888] mb-2">Content Type</label>
                  <select
                    value={filters.mediaType}
                    onChange={(e) => setFilters({ ...filters, mediaType: e.target.value as "all" | "movie" | "tv" })}
                    className="w-full p-3 bg-black/60 border border-purple-500/30 rounded-xl text-white focus:border-purple-500 transition-colors"
                  >
                    <option value="all">Movies & TV Shows</option>
                    <option value="movie">Movies Only</option>
                    <option value="tv">TV Shows Only</option>
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
                searchResults.map((media) => (
                  <div
                    key={`${media.mediaType}-${media.tmdbId}`}
                    onClick={() => selectMedia(media)}
                    className="flex items-center p-4 cursor-pointer border-b border-purple-500/20 last:border-b-0 hover:bg-purple-600/20 hover:translate-x-1 transition-all duration-200"
                  >
                    <img
                      src={media.poster || "/placeholder.svg?height=75&width=50"}
                      alt={media.title}
                      className="w-12 h-18 object-cover rounded-lg border border-purple-500/30 mr-4"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = "/placeholder.svg?height=75&width=50"
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <div className="font-semibold text-white mr-2">{media.title}</div>
                        <div
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            media.mediaType === "tv"
                              ? "bg-blue-600/80 text-blue-100"
                              : "bg-purple-600/80 text-purple-100"
                          }`}
                        >
                          {media.mediaType === "tv" ? "TV" : "Movie"}
                        </div>
                      </div>
                      <div className="text-[#888] text-sm flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {media.year}
                        {media.rating && (
                          <>
                            <Star className="w-3 h-3 ml-3 mr-1 text-yellow-500" />
                            <span className="text-yellow-500">{media.rating.toFixed(1)}</span>
                          </>
                        )}
                      </div>
                      {media.overview && <div className="text-[#666] text-xs mt-1 line-clamp-2">{media.overview}</div>}
                    </div>
                  </div>
                ))
              ) : searchQuery.length >= 2 ? (
                <div className="text-center py-6 text-[#888]">no content found</div>
              ) : null}
            </div>
          )}
        </div>

        {/* Trending Content */}
        {!selectedMedia && trendingMedia.length > 0 && (
          <div className="mb-12 relative z-10">
            <div className="flex items-center mb-8">
              <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full mr-4"></div>
              <h2 className="text-3xl font-bold text-white">Trending This Week</h2>
            </div>
            <div className="flex space-x-6 overflow-x-auto pb-4">
              {trendingMedia.map((media) => (
                <MediaCard key={`${media.mediaType}-${media.tmdbId}`} media={media} showFavorite size="large" />
              ))}
            </div>
          </div>
        )}

        {/* Recommended Content */}
        {!selectedMedia && recommendedMedia.length > 0 && (
          <div className="mb-12 relative z-10">
            <div className="flex items-center mb-8">
              <Heart className="w-6 h-6 mr-3 text-pink-500" />
              <h2 className="text-2xl font-bold text-white">
                {watchHistory.length > 0 ? "Recommended for You" : "Popular Content"}
              </h2>
            </div>
            <div className="flex space-x-4 overflow-x-auto pb-4">
              {recommendedMedia.map((media) => (
                <MediaCard key={`${media.mediaType}-${media.tmdbId}`} media={media} showFavorite />
              ))}
            </div>
          </div>
        )}

        {/* Continue Watching */}
        {!selectedMedia && watchHistory.length > 0 && (
          <div className="mb-12 relative z-10">
            <div className="flex items-center mb-8">
              <Clock className="w-6 h-6 mr-3 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">Continue Watching</h2>
            </div>
            <div className="flex space-x-4 overflow-x-auto pb-4">
              {watchHistory.slice(0, 6).map((media, index) => (
                <MediaCard key={`${media.mediaType}-${media.tmdbId}-${index}`} media={media} showFavorite />
              ))}
            </div>
          </div>
        )}

        {/* Player Container */}
        <div className="bg-black/60 border-2 border-purple-500/30 rounded-3xl p-8 backdrop-blur-xl animate-fade-in-up-delay-400 relative z-10">
          {selectedMedia ? (
            <>
              <div className="flex justify-between items-start mb-8">
                <div className="flex-1">
                  <div className="flex items-center mb-3">
                    <h2 className="text-4xl font-bold text-white mr-4">{selectedMedia.title}</h2>
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedMedia.mediaType === "tv"
                          ? "bg-blue-600/80 text-blue-100"
                          : "bg-purple-600/80 text-purple-100"
                      }`}
                    >
                      {selectedMedia.mediaType === "tv" ? (
                        <div className="flex items-center">
                          <Tv className="w-4 h-4 mr-1" />
                          TV Show
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Film className="w-4 h-4 mr-1" />
                          Movie
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Episode info for TV shows */}
                  {selectedMedia.mediaType === "tv" && selectedEpisodeData && (
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold text-purple-300 mb-1">
                        Season {selectedSeason}, Episode {selectedEpisode}
                      </h3>
                      <h4 className="text-lg text-white">{selectedEpisodeData.name}</h4>
                    </div>
                  )}

                  <div className="flex items-center text-[#888] text-sm space-x-6 mb-4">
                    <span className="px-3 py-1 bg-purple-600/20 rounded-full text-purple-400 text-xs font-medium">
                      NOW PLAYING
                    </span>
                    {selectedMedia.year && (
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {selectedMedia.year}
                      </span>
                    )}
                    {selectedMedia.rating && (
                      <span className="flex items-center text-yellow-500">
                        <Star className="w-4 h-4 mr-1" />
                        {selectedMedia.rating.toFixed(1)}
                      </span>
                    )}
                    {selectedMedia.runtime && (
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {selectedMedia.runtime}min
                      </span>
                    )}
                  </div>
                  {selectedMedia.genre && <div className="text-purple-300 text-sm mb-3">{selectedMedia.genre}</div>}
                  {(selectedEpisodeData?.overview || selectedMedia.overview) && (
                    <p className="text-[#ccc] text-sm leading-relaxed max-w-3xl">
                      {selectedEpisodeData?.overview || selectedMedia.overview}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleToggleFavorite(selectedMedia)}
                  className="p-4 bg-black/70 rounded-2xl hover:bg-black/90 transition-all duration-300 hover:scale-105"
                >
                  <Heart
                    className={`w-6 h-6 ${favorites.includes(selectedMedia.tmdbId) ? "fill-red-500 text-red-500" : "text-white"}`}
                  />
                </button>
              </div>

              {/* Season/Episode Selector for TV Shows */}
              {selectedMedia.mediaType === "tv" && selectedMedia.totalSeasons && (
                <div className="mb-8">
                  <SeasonEpisodeSelector
                    tmdbId={selectedMedia.tmdbId}
                    totalSeasons={selectedMedia.totalSeasons}
                    onEpisodeSelect={handleEpisodeSelect}
                    currentSeason={selectedSeason}
                    currentEpisode={selectedEpisode}
                  />
                </div>
              )}

              <div className="relative w-full pb-[56.25%] rounded-2xl overflow-hidden bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/20">
                <iframe
                  src={getPlayerUrl()}
                  className="absolute inset-0 w-full h-full border-0 rounded-2xl"
                  allowFullScreen
                  allow="encrypted-media"
                  title={selectedMedia.mediaType === "tv" ? "TV Show Player" : "Movie Player"}
                />
              </div>
              <div className="mt-6 text-center">
                <p className="text-[#666] text-xs">
                  Powered by <span className="text-purple-400 font-medium">Videasy</span> • High-quality streaming with
                  no ads
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
                <div className="text-[#888] text-lg">Search and select movies or TV shows to start streaming</div>
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
