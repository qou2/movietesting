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
      style={{
        cursor: "pointer",
        transition: "all 0.3s ease",
      }}
      onClick={() => router.push(`/?watch=${media.tmdbId}&type=${media.mediaType}`)}
      onMouseEnter={(e) => {
        const target = e.currentTarget as HTMLElement
        target.style.transform = "translateY(-4px)"
      }}
      onMouseLeave={(e) => {
        const target = e.currentTarget as HTMLElement
        target.style.transform = "translateY(0)"
      }}
    >
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: "12px",
          backgroundColor: "rgba(0, 0, 0, 0.2)",
          border: "1px solid rgba(147, 51, 234, 0.2)",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          const target = e.currentTarget as HTMLElement
          target.style.borderColor = "rgba(147, 51, 234, 0.5)"
        }}
        onMouseLeave={(e) => {
          const target = e.currentTarget as HTMLElement
          target.style.borderColor = "rgba(147, 51, 234, 0.2)"
        }}
      >
        <div style={{ aspectRatio: "2/3", position: "relative" }}>
          <img
            src={media.poster || "/placeholder.svg?height=450&width=300"}
            alt={media.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.3s ease",
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = "/placeholder.svg?height=450&width=300"
            }}
            onMouseEnter={(e) => {
              const target = e.target as HTMLImageElement
              target.style.transform = "scale(1.05)"
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLImageElement
              target.style.transform = "scale(1)"
            }}
          />

          {/* Overlay */}
          <div
            style={{
              position: "absolute",
              inset: "0",
              background: "linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent, transparent)",
              opacity: "0",
              transition: "opacity 0.3s ease",
            }}
            onMouseEnter={(e) => {
              const target = e.currentTarget as HTMLElement
              target.style.opacity = "1"
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget as HTMLElement
              target.style.opacity = "0"
            }}
          />

          {/* Media Type Badge */}
          <div style={{ position: "absolute", top: "8px", left: "8px" }}>
            <div
              style={{
                padding: "4px 8px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "500",
                backgroundColor: media.mediaType === "tv" ? "rgba(37, 99, 235, 0.8)" : "rgba(147, 51, 234, 0.8)",
                color: media.mediaType === "tv" ? "#dbeafe" : "#e9d5ff",
                display: "flex",
                alignItems: "center",
              }}
            >
              {media.mediaType === "tv" ? (
                <>
                  <Tv style={{ width: "12px", height: "12px", marginRight: "4px" }} />
                  TV
                </>
              ) : (
                <>
                  <Film style={{ width: "12px", height: "12px", marginRight: "4px" }} />
                  Movie
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div
            style={{
              position: "absolute",
              bottom: "16px",
              left: "16px",
              right: "16px",
              transform: "translateY(16px)",
              transition: "all 0.3s ease",
              opacity: "0",
            }}
            onMouseEnter={(e) => {
              const target = e.currentTarget as HTMLElement
              target.style.transform = "translateY(0)"
              target.style.opacity = "1"
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget as HTMLElement
              target.style.transform = "translateY(16px)"
              target.style.opacity = "0"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    backgroundColor: "#7c3aed",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Play style={{ width: "16px", height: "16px", color: "white" }} />
                </div>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Info style={{ width: "16px", height: "16px", color: "white" }} />
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFavorite(media)
                }}
                style={{
                  padding: "8px",
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  borderRadius: "50%",
                  border: "none",
                  cursor: "pointer",
                  transition: "background-color 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  const target = e.currentTarget as HTMLElement
                  target.style.backgroundColor = "rgba(0, 0, 0, 0.9)"
                }}
                onMouseLeave={(e) => {
                  const target = e.currentTarget as HTMLElement
                  target.style.backgroundColor = "rgba(0, 0, 0, 0.7)"
                }}
              >
                <Heart
                  style={{
                    width: "16px",
                    height: "16px",
                    color: favorites.includes(media.tmdbId) ? "#ef4444" : "white",
                    fill: favorites.includes(media.tmdbId) ? "#ef4444" : "none",
                  }}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: "16px" }}>
          <h3
            style={{
              fontWeight: "600",
              color: "white",
              fontSize: "14px",
              marginBottom: "8px",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {media.title}
          </h3>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "12px",
              color: "#888",
            }}
          >
            <span>{media.year}</span>
            {media.rating && (
              <div style={{ display: "flex", alignItems: "center" }}>
                <Star style={{ width: "12px", height: "12px", color: "#eab308", marginRight: "4px" }} />
                <span style={{ color: "#eab308" }}>{media.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #0a0a0a 100%)",
        color: "#e0e0e0",
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid rgba(147, 51, 234, 0.2)",
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(20px)",
          position: "sticky",
          top: "0",
          zIndex: "50",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px 32px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <button
                onClick={() => router.push("/")}
                style={{
                  padding: "8px",
                  backgroundColor: "transparent",
                  border: "none",
                  borderRadius: "12px",
                  cursor: "pointer",
                  transition: "background-color 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  const target = e.currentTarget as HTMLElement
                  target.style.backgroundColor = "rgba(147, 51, 234, 0.2)"
                }}
                onMouseLeave={(e) => {
                  const target = e.currentTarget as HTMLElement
                  target.style.backgroundColor = "transparent"
                }}
              >
                <ArrowLeft style={{ width: "20px", height: "20px", color: "#a855f7" }} />
              </button>
              <div>
                <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "white", margin: "0" }}>Browse Content</h1>
                <p style={{ color: "#888", fontSize: "14px", margin: "0" }}>{getFilterSummary()}</p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {/* View Mode Toggle */}
              <div
                style={{
                  display: "flex",
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  borderRadius: "12px",
                  border: "1px solid rgba(147, 51, 234, 0.3)",
                }}
              >
                <button
                  onClick={() => setViewMode("grid")}
                  style={{
                    padding: "8px",
                    borderRadius: "12px 0 0 12px",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    backgroundColor: viewMode === "grid" ? "#7c3aed" : "transparent",
                    color: viewMode === "grid" ? "white" : "#888",
                  }}
                >
                  <Grid3X3 style={{ width: "16px", height: "16px" }} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  style={{
                    padding: "8px",
                    borderRadius: "0 12px 12px 0",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    backgroundColor: viewMode === "list" ? "#7c3aed" : "transparent",
                    color: viewMode === "list" ? "white" : "#888",
                  }}
                >
                  <List style={{ width: "16px", height: "16px" }} />
                </button>
              </div>

              {/* Sort Options */}
              <div style={{ position: "relative" }}>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    border: "1px solid rgba(147, 51, 234, 0.3)",
                    borderRadius: "12px",
                    padding: "8px 32px 8px 16px",
                    color: "white",
                    fontSize: "14px",
                    appearance: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="popularity">Popularity</option>
                  <option value="rating">Rating</option>
                  <option value="year">Year</option>
                  <option value="title">Title</option>
                </select>
                <ChevronDown
                  style={{
                    position: "absolute",
                    right: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "16px",
                    height: "16px",
                    color: "#888",
                    pointerEvents: "none",
                  }}
                />
              </div>

              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                style={{
                  padding: "8px",
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  border: "1px solid rgba(147, 51, 234, 0.3)",
                  borderRadius: "12px",
                  cursor: "pointer",
                  transition: "border-color 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  const target = e.currentTarget as HTMLElement
                  target.style.borderColor = "#7c3aed"
                }}
                onMouseLeave={(e) => {
                  const target = e.currentTarget as HTMLElement
                  target.style.borderColor = "rgba(147, 51, 234, 0.3)"
                }}
              >
                {sortOrder === "asc" ? (
                  <SortAsc style={{ width: "16px", height: "16px", color: "white" }} />
                ) : (
                  <SortDesc style={{ width: "16px", height: "16px", color: "white" }} />
                )}
              </button>

              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  padding: "8px",
                  borderRadius: "12px",
                  border: showFilters ? "none" : "1px solid rgba(147, 51, 234, 0.3)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  position: "relative",
                  backgroundColor: showFilters ? "#7c3aed" : "rgba(0, 0, 0, 0.6)",
                  color: showFilters ? "white" : "#888",
                }}
              >
                <Filter style={{ width: "16px", height: "16px" }} />
                {getActiveFiltersCount() > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-4px",
                      right: "-4px",
                      backgroundColor: "#ef4444",
                      color: "white",
                      fontSize: "12px",
                      borderRadius: "50%",
                      width: "20px",
                      height: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {getActiveFiltersCount()}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                border: "1px solid rgba(147, 51, 234, 0.3)",
                borderRadius: "12px",
                padding: "24px",
                backdropFilter: "blur(20px)",
              }}
            >
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}
              >
                <h3 style={{ color: "white", fontWeight: "600", margin: "0" }}>Filters</h3>
                <button
                  onClick={clearFilters}
                  style={{
                    color: "#666",
                    backgroundColor: "transparent",
                    border: "none",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                    transition: "color 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    const target = e.currentTarget as HTMLElement
                    target.style.color = "white"
                  }}
                  onMouseLeave={(e) => {
                    const target = e.currentTarget as HTMLElement
                    target.style.color = "#666"
                  }}
                >
                  <X style={{ width: "16px", height: "16px", marginRight: "4px" }} />
                  Clear All
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "16px",
                }}
              >
                <div>
                  <label style={{ display: "block", fontSize: "14px", color: "#888", marginBottom: "8px" }}>
                    Search
                  </label>
                  <input
                    type="text"
                    value={filters.query}
                    onChange={(e) => handleFilterChange({ query: e.target.value })}
                    placeholder="Search titles..."
                    style={{
                      width: "100%",
                      padding: "12px",
                      backgroundColor: "rgba(0, 0, 0, 0.6)",
                      border: "1px solid rgba(147, 51, 234, 0.3)",
                      borderRadius: "12px",
                      color: "white",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "14px", color: "#888", marginBottom: "8px" }}>
                    Content Type
                  </label>
                  <select
                    value={filters.mediaType}
                    onChange={(e) => handleFilterChange({ mediaType: e.target.value as "all" | "movie" | "tv" })}
                    style={{
                      width: "100%",
                      padding: "12px",
                      backgroundColor: "rgba(0, 0, 0, 0.6)",
                      border: "1px solid rgba(147, 51, 234, 0.3)",
                      borderRadius: "12px",
                      color: "white",
                      fontSize: "14px",
                    }}
                  >
                    <option value="all">All</option>
                    <option value="movie">Movies</option>
                    <option value="tv">TV Shows</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "14px", color: "#888", marginBottom: "8px" }}>
                    Genre
                  </label>
                  <select
                    value={filters.genre}
                    onChange={(e) => handleFilterChange({ genre: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px",
                      backgroundColor: "rgba(0, 0, 0, 0.6)",
                      border: "1px solid rgba(147, 51, 234, 0.3)",
                      borderRadius: "12px",
                      color: "white",
                      fontSize: "14px",
                    }}
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
                  <label style={{ display: "block", fontSize: "14px", color: "#888", marginBottom: "8px" }}>
                    Year Range
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="number"
                      value={filters.yearFrom}
                      onChange={(e) => handleFilterChange({ yearFrom: e.target.value })}
                      placeholder="From"
                      style={{
                        width: "100%",
                        padding: "12px",
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        border: "1px solid rgba(147, 51, 234, 0.3)",
                        borderRadius: "12px",
                        color: "white",
                        fontSize: "14px",
                      }}
                    />
                    <input
                      type="number"
                      value={filters.yearTo}
                      onChange={(e) => handleFilterChange({ yearTo: e.target.value })}
                      placeholder="To"
                      style={{
                        width: "100%",
                        padding: "12px",
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        border: "1px solid rgba(147, 51, 234, 0.3)",
                        borderRadius: "12px",
                        color: "white",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "14px", color: "#888", marginBottom: "8px" }}>
                    Min Rating
                  </label>
                  <select
                    value={filters.minRating}
                    onChange={(e) => handleFilterChange({ minRating: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px",
                      backgroundColor: "rgba(0, 0, 0, 0.6)",
                      border: "1px solid rgba(147, 51, 234, 0.3)",
                      borderRadius: "12px",
                      color: "white",
                      fontSize: "14px",
                    }}
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "16px",
              fontSize: "14px",
              color: "#888",
            }}
          >
            <span>{isLoading ? "Loading..." : `${totalResults.toLocaleString()} results found`}</span>
            <span>Page {currentPage}</span>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px" }}>
        {results.length > 0 ? (
          <>
            <div
              style={{
                display: "grid",
                gap: "24px",
                gridTemplateColumns:
                  viewMode === "grid"
                    ? "repeat(auto-fill, minmax(180px, 1fr))"
                    : "repeat(auto-fill, minmax(300px, 1fr))",
              }}
            >
              {results.map((media) => (
                <MediaCard key={`${media.mediaType}-${media.tmdbId}`} media={media} />
              ))}
            </div>

            {/* Load More */}
            {results.length < totalResults && (
              <div style={{ textAlign: "center", marginTop: "48px" }}>
                <button
                  onClick={loadMore}
                  disabled={isLoading}
                  style={{
                    backgroundColor: "#7c3aed",
                    color: "white",
                    padding: "12px 32px",
                    borderRadius: "12px",
                    fontWeight: "500",
                    border: "none",
                    cursor: "pointer",
                    transition: "background-color 0.3s ease",
                    opacity: isLoading ? "0.5" : "1",
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      const target = e.currentTarget as HTMLElement
                      target.style.backgroundColor = "#6d28d9"
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) {
                      const target = e.currentTarget as HTMLElement
                      target.style.backgroundColor = "#7c3aed"
                    }
                  }}
                >
                  {isLoading ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div
              style={{
                width: "80px",
                height: "80px",
                background: "linear-gradient(135deg, #7c3aed, #ec4899)",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
              }}
            >
              <Search style={{ width: "40px", height: "40px", color: "white" }} />
            </div>
            <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "white", marginBottom: "8px" }}>
              No Results Found
            </h2>
            <p style={{ color: "#888", marginBottom: "24px" }}>Try adjusting your filters or search terms</p>
            <button
              onClick={clearFilters}
              style={{
                backgroundColor: "#7c3aed",
                color: "white",
                padding: "12px 24px",
                borderRadius: "12px",
                fontWeight: "500",
                border: "none",
                cursor: "pointer",
                transition: "background-color 0.3s ease",
              }}
              onMouseEnter={(e) => {
                const target = e.currentTarget as HTMLElement
                target.style.backgroundColor = "#6d28d9"
              }}
              onMouseLeave={(e) => {
                const target = e.currentTarget as HTMLElement
                target.style.backgroundColor = "#7c3aed"
              }}
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #0a0a0a 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ color: "#a855f7", animation: "pulse 2s infinite" }}>Loading...</div>
        </div>
      }
    >
      <BrowseContent />
    </Suspense>
  )
}
