"use client"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  Search,
  Filter,
  X,
  Star,
  Heart,
  Play,
  Info,
  Tv,
  Film,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  ChevronDown,
  ArrowLeft,
} from "lucide-react"
import { useDatabase } from "@/hooks/useDatabase"

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
}

interface SearchFilters {
  genre: string
  yearFrom: string
  yearTo: string
  minRating: string
  mediaType: "all" | "movie" | "tv"
  query: string
}

const TMDB_ACCESS_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmZDllMzlkNGJhNGEwZDg3OGJhMzY5ZTM5NzkzYjVmOCIsIm5iZiI6MTc1MDc0NDI3MS41MDIsInN1YiI6IjY4NWEzY2NmODk4NDFiZTJhODRmNmE5ZiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.einV7s-uINbA8P9uXQixNmB9ALAIEjDbhfOXuX4wn5I"
const TMDB_BASE_URL = "https://api.themoviedb.org/3"
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p"

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

type SortOption = "popularity" | "rating" | "year" | "title"
type ViewMode = "grid" | "list"

function BrowseContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { favorites, toggleFavorite } = useDatabase()

  const [results, setResults] = useState<Media[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [totalResults, setTotalResults] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [sortBy, setSortBy] = useState<SortOption>("popularity")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [showFilters, setShowFilters] = useState(false)

  const [filters, setFilters] = useState<SearchFilters>({
    genre: searchParams.get("genre") || "",
    yearFrom: searchParams.get("year_from") || "",
    yearTo: searchParams.get("year_to") || "",
    minRating: searchParams.get("min_rating") || "",
    mediaType: (searchParams.get("media_type") as "all" | "movie" | "tv") || "all",
    query: searchParams.get("q") || "",
  })

  const parseYear = (dateString: string | null | undefined): string => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      const year = date.getFullYear()
      const currentYear = new Date().getFullYear()
      if (year >= 1900 && year <= currentYear + 5) {
        return year.toString()
      }
      const yearMatch = dateString.match(/(\d{4})/)
      if (yearMatch) {
        const extractedYear = Number.parseInt(yearMatch[1])
        if (extractedYear >= 1900 && extractedYear <= currentYear + 5) {
          return extractedYear.toString()
        }
      }
      return ""
    } catch (error) {
      return ""
    }
  }

  const updateURL = (newFilters: SearchFilters) => {
    const params = new URLSearchParams()
    if (newFilters.query) params.set("q", newFilters.query)
    if (newFilters.genre) params.set("genre", newFilters.genre)
    if (newFilters.yearFrom) params.set("year_from", newFilters.yearFrom)
    if (newFilters.yearTo) params.set("year_to", newFilters.yearTo)
    if (newFilters.minRating) params.set("min_rating", newFilters.minRating)
    if (newFilters.mediaType !== "all") params.set("media_type", newFilters.mediaType)

    router.push(`/browse?${params.toString()}`)
  }

  const searchContent = async (page = 1) => {
    setIsLoading(true)
    try {
      let allResults: Media[] = []

      if (filters.query) {
        // Search with query
        const searches = []

        if (filters.mediaType === "all" || filters.mediaType === "movie") {
          searches.push(
            fetch(`${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(filters.query)}&page=${page}`, {
              headers: {
                Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
              },
            }),
          )
        } else {
          searches.push(Promise.resolve({ json: () => ({ results: [], total_results: 0 }) }))
        }

        if (filters.mediaType === "all" || filters.mediaType === "tv") {
          searches.push(
            fetch(`${TMDB_BASE_URL}/search/tv?query=${encodeURIComponent(filters.query)}&page=${page}`, {
              headers: {
                Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
              },
            }),
          )
        } else {
          searches.push(Promise.resolve({ json: () => ({ results: [], total_results: 0 }) }))
        }

        const [movieResponse, tvResponse] = await Promise.all(searches)
        const [movieData, tvData] = await Promise.all([movieResponse.json(), tvResponse.json()])

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

        setTotalResults((movieData.total_results || 0) + (tvData.total_results || 0))
      } else {
        // Discover/browse without query
        const discoverEndpoint = filters.mediaType === "tv" ? "tv" : "movie"
        const url = new URL(`${TMDB_BASE_URL}/discover/${discoverEndpoint}`)

        url.searchParams.set("page", page.toString())
        url.searchParams.set("sort_by", "popularity.desc")

        if (filters.genre) {
          const genreId = genres.find((g) => g.name.toLowerCase() === filters.genre.toLowerCase())?.id
          if (genreId) url.searchParams.set("with_genres", genreId.toString())
        }

        if (filters.yearFrom && filters.yearTo) {
          const dateField = discoverEndpoint === "tv" ? "first_air_date" : "release_date"
          url.searchParams.set(`${dateField}.gte`, `${filters.yearFrom}-01-01`)
          url.searchParams.set(`${dateField}.lte`, `${filters.yearTo}-12-31`)
        }

        if (filters.minRating) {
          url.searchParams.set("vote_average.gte", filters.minRating)
        }

        if (filters.mediaType === "all") {
          // For "all", we need to fetch both movies and TV shows
          const [movieResponse, tvResponse] = await Promise.all([
            fetch(url.toString().replace("/discover/movie", "/discover/movie"), {
              headers: {
                Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
              },
            }),
            fetch(url.toString().replace("/discover/movie", "/discover/tv"), {
              headers: {
                Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
              },
            }),
          ])

          const [movieData, tvData] = await Promise.all([movieResponse.json(), tvResponse.json()])

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

          setTotalResults((movieData.total_results || 0) + (tvData.total_results || 0))
        } else {
          const response = await fetch(url.toString(), {
            headers: {
              Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
              "Content-Type": "application/json",
            },
          })
          const data = await response.json()

          if (data.results) {
            allResults = data.results.map((item: any) => ({
              title: item.title || item.name,
              year: parseYear(item.release_date || item.first_air_date),
              tmdbId: item.id,
              poster: item.poster_path ? `${TMDB_IMAGE_BASE_URL}/w500${item.poster_path}` : undefined,
              backdrop: item.backdrop_path ? `${TMDB_IMAGE_BASE_URL}/w1280${item.backdrop_path}` : undefined,
              overview: item.overview,
              rating: item.vote_average,
              releaseDate: item.release_date || item.first_air_date,
              mediaType: filters.mediaType as "movie" | "tv",
            }))
          }

          setTotalResults(data.total_results || 0)
        }
      }

      // Apply additional filters
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

      // Apply sorting
      filteredResults.sort((a, b) => {
        let comparison = 0
        switch (sortBy) {
          case "rating":
            comparison = (b.rating || 0) - (a.rating || 0)
            break
          case "year":
            comparison = Number.parseInt(b.year || "0") - Number.parseInt(a.year || "0")
            break
          case "title":
            comparison = a.title.localeCompare(b.title)
            break
          case "popularity":
          default:
            comparison = (b.rating || 0) - (a.rating || 0)
            break
        }
        return sortOrder === "asc" ? -comparison : comparison
      })

      if (page === 1) {
        setResults(filteredResults)
      } else {
        setResults((prev) => [...prev, ...filteredResults])
      }
    } catch (error) {
      console.error("Search failed:", error)
      setResults([])
      setTotalResults(0)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    searchContent(1)
    setCurrentPage(1)
  }, [filters, sortBy, sortOrder])

  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    updateURL(updatedFilters)
  }

  const clearFilters = () => {
    const clearedFilters: SearchFilters = {
      genre: "",
      yearFrom: "",
      yearTo: "",
      minRating: "",
      mediaType: "all",
      query: "",
    }
    setFilters(clearedFilters)
    updateURL(clearedFilters)
  }

  const loadMore = () => {
    const nextPage = currentPage + 1
    setCurrentPage(nextPage)
    searchContent(nextPage)
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.genre) count++
    if (filters.yearFrom || filters.yearTo) count++
    if (filters.minRating) count++
    if (filters.mediaType !== "all") count++
    return count
  }

  const getFilterSummary = () => {
    const parts = []
    if (filters.query) parts.push(`"${filters.query}"`)
    if (filters.genre) parts.push(filters.genre)
    if (filters.mediaType !== "all") parts.push(filters.mediaType === "tv" ? "TV Shows" : "Movies")
    if (filters.yearFrom && filters.yearTo) parts.push(`${filters.yearFrom}-${filters.yearTo}`)
    else if (filters.yearFrom) parts.push(`from ${filters.yearFrom}`)
    else if (filters.yearTo) parts.push(`until ${filters.yearTo}`)
    if (filters.minRating) parts.push(`${filters.minRating}+ rating`)

    return parts.length > 0 ? parts.join(" • ") : "All Content"
  }

  const MediaCard = ({ media }: { media: Media }) => (
    <div
      className="group cursor-pointer"
      onClick={() => router.push(`/?watch=${media.tmdbId}&type=${media.mediaType}`)}
    >
      <div className="relative overflow-hidden rounded-xl bg-black/20 border border-purple-500/20 hover:border-purple-500/50 transition-all duration-300">
        <div className="aspect-[2/3] relative">
          <img
            src={media.poster || "/placeholder.svg?height=450&width=300"}
            alt={media.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = "/placeholder.svg?height=450&width=300"
            }}
          />

          {/* Overlay */}
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

          {/* Actions */}
          <div className="absolute bottom-4 left-4 right-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Play className="w-8 h-8 text-white bg-purple-600 rounded-full p-2" />
                <Info className="w-8 h-8 text-white bg-black/50 rounded-full p-2" />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFavorite(media)
                }}
                className="p-2 bg-black/70 rounded-full hover:bg-black/90 transition-colors"
              >
                <Heart
                  className={`w-4 h-4 ${favorites.includes(media.tmdbId) ? "fill-red-500 text-red-500" : "text-white"}`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-white text-sm mb-2 line-clamp-2">{media.title}</h3>
          <div className="flex items-center justify-between text-xs text-[#888]">
            <span>{media.year}</span>
            {media.rating && (
              <div className="flex items-center">
                <Star className="w-3 h-3 text-yellow-500 mr-1" />
                <span className="text-yellow-500">{media.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a0a2e] to-[#0a0a0a] text-[#e0e0e0]">
      {/* Header */}
      <div className="border-b border-purple-500/20 bg-black/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/")}
                className="p-2 hover:bg-purple-600/20 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-purple-400" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Browse Content</h1>
                <p className="text-[#888] text-sm">{getFilterSummary()}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* View Mode Toggle */}
              <div className="flex bg-black/60 rounded-xl border border-purple-500/30">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-l-xl transition-colors ${
                    viewMode === "grid" ? "bg-purple-600 text-white" : "text-[#888] hover:text-white"
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-r-xl transition-colors ${
                    viewMode === "list" ? "bg-purple-600 text-white" : "text-[#888] hover:text-white"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Sort Options */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-black/60 border border-purple-500/30 rounded-xl px-4 py-2 text-white text-sm focus:border-purple-500 transition-colors appearance-none pr-8"
                >
                  <option value="popularity">Popularity</option>
                  <option value="rating">Rating</option>
                  <option value="year">Year</option>
                  <option value="title">Title</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#888] pointer-events-none" />
              </div>

              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="p-2 bg-black/60 border border-purple-500/30 rounded-xl hover:border-purple-500 transition-colors"
              >
                {sortOrder === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-xl transition-colors relative ${
                  showFilters
                    ? "bg-purple-600 text-white"
                    : "bg-black/60 border border-purple-500/30 text-[#888] hover:text-white"
                }`}
              >
                <Filter className="w-4 h-4" />
                {getActiveFiltersCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {getActiveFiltersCount()}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="bg-black/80 border border-purple-500/30 rounded-xl p-6 backdrop-blur-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-semibold">Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-[#666] hover:text-white text-sm flex items-center transition-colors"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear All
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm text-[#888] mb-2">Search</label>
                  <input
                    type="text"
                    value={filters.query}
                    onChange={(e) => handleFilterChange({ query: e.target.value })}
                    placeholder="Search titles..."
                    className="w-full p-3 bg-black/60 border border-purple-500/30 rounded-xl text-white focus:border-purple-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#888] mb-2">Content Type</label>
                  <select
                    value={filters.mediaType}
                    onChange={(e) => handleFilterChange({ mediaType: e.target.value as "all" | "movie" | "tv" })}
                    className="w-full p-3 bg-black/60 border border-purple-500/30 rounded-xl text-white focus:border-purple-500 transition-colors"
                  >
                    <option value="all">All</option>
                    <option value="movie">Movies</option>
                    <option value="tv">TV Shows</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-[#888] mb-2">Genre</label>
                  <select
                    value={filters.genre}
                    onChange={(e) => handleFilterChange({ genre: e.target.value })}
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
                  <label className="block text-sm text-[#888] mb-2">Year Range</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={filters.yearFrom}
                      onChange={(e) => handleFilterChange({ yearFrom: e.target.value })}
                      placeholder="From"
                      className="w-full p-3 bg-black/60 border border-purple-500/30 rounded-xl text-white focus:border-purple-500 transition-colors"
                    />
                    <input
                      type="number"
                      value={filters.yearTo}
                      onChange={(e) => handleFilterChange({ yearTo: e.target.value })}
                      placeholder="To"
                      className="w-full p-3 bg-black/60 border border-purple-500/30 rounded-xl text-white focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[#888] mb-2">Min Rating</label>
                  <select
                    value={filters.minRating}
                    onChange={(e) => handleFilterChange({ minRating: e.target.value })}
                    className="w-full p-3 bg-black/60 border border-purple-500/30 rounded-xl text-white focus:border-purple-500 transition-colors"
                  >
                    <option value="">Any Rating</option>
                    <option value="7">7.0+</option>
                    <option value="8">8.0+</option>
                    <option value="9">9.0+</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Results Summary */}
          <div className="flex items-center justify-between mt-4 text-sm text-[#888]">
            <span>{isLoading ? "Loading..." : `${totalResults.toLocaleString()} results found`}</span>
            <span>Page {currentPage}</span>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {results.length > 0 ? (
          <>
            <div
              className={`grid gap-6 ${
                viewMode === "grid"
                  ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                  : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              }`}
            >
              {results.map((media) => (
                <MediaCard key={`${media.mediaType}-${media.tmdbId}`} media={media} />
              ))}
            </div>

            {/* Load More */}
            {results.length < totalResults && (
              <div className="text-center mt-12">
                <button
                  onClick={loadMore}
                  disabled={isLoading}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-medium transition-colors"
                >
                  {isLoading ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No Results Found</h2>
            <p className="text-[#888] mb-6">Try adjusting your filters or search terms</p>
            <button
              onClick={clearFilters}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a0a2e] to-[#0a0a0a] flex items-center justify-center">
          <div className="text-purple-400 animate-pulse">Loading...</div>
        </div>
      }
    >
      <BrowseContent />
    </Suspense>
  )
}
