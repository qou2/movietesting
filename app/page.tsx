"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Search, Filter, X, Star, Calendar, Clock, Heart, Play, Tv, Film, User, Lock } from "lucide-react"
import { useDatabase } from "@/hooks/useDatabase"
import SeasonEpisodeSelector from "@/components/season-episode-selector"
import { useRouter, useSearchParams } from "next/navigation"

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
  const router = useRouter()
  const searchParams = useSearchParams()
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

  // Inline styles
  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #0a0a0a 100%)",
    color: "#e0e0e0",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
    position: "relative",
    overflowX: "hidden",
  }

  const headerStyle: React.CSSProperties = {
    textAlign: "center",
    marginBottom: "3rem",
    animation: "fadeInUp 0.8s ease-out",
  }

  const titleStyle: React.CSSProperties = {
    fontSize: "3rem",
    fontWeight: "bold",
    background: "linear-gradient(135deg, #a855f7, #ec4899, #a855f7)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    letterSpacing: "-0.025em",
    marginBottom: "1rem",
  }

  const searchContainerStyle: React.CSSProperties = {
    position: "relative",
    maxWidth: "32rem",
    margin: "0 auto 3rem auto",
    zIndex: 50,
  }

  const searchInputStyle: React.CSSProperties = {
    width: "100%",
    paddingLeft: "3rem",
    paddingRight: "4rem",
    paddingTop: "1rem",
    paddingBottom: "1rem",
    fontSize: "1.125rem",
    border: "2px solid rgba(168, 85, 247, 0.3)",
    borderRadius: "1rem",
    background: "rgba(0, 0, 0, 0.6)",
    backdropFilter: "blur(12px)",
    color: "white",
    outline: "none",
    transition: "all 0.3s ease",
  }

  const buttonStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, #7c3aed, #ec4899)",
    color: "white",
    padding: "0.75rem 1.5rem",
    borderRadius: "0.75rem",
    border: "none",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  }

  const cardStyle: React.CSSProperties = {
    background: "rgba(0, 0, 0, 0.6)",
    border: "2px solid rgba(168, 85, 247, 0.3)",
    borderRadius: "1.5rem",
    padding: "2rem",
    backdropFilter: "blur(12px)",
    animation: "fadeInUp 0.8s ease-out 0.4s both",
  }

  const playerContainerStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    paddingBottom: "56.25%",
    borderRadius: "1rem",
    overflow: "hidden",
    background: "linear-gradient(135deg, rgba(139, 69, 193, 0.2), rgba(236, 72, 153, 0.2))",
    border: "1px solid rgba(168, 85, 247, 0.2)",
  }

  const iframeStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    border: "none",
    borderRadius: "1rem",
  }

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

  // Check for direct media loading from URL params
  useEffect(() => {
    const watchId = searchParams.get("watch")
    const mediaType = searchParams.get("type") as "movie" | "tv"

    if (watchId && mediaType) {
      loadMediaById(Number.parseInt(watchId), mediaType)
    }
  }, [searchParams])

  const loadMediaById = async (tmdbId: number, mediaType: "movie" | "tv") => {
    try {
      const endpoint = mediaType === "tv" ? "tv" : "movie"
      const response = await fetch(`${TMDB_BASE_URL}/${endpoint}/${tmdbId}`, {
        headers: {
          Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      })
      const detailData = await response.json()

      const media: Media = {
        title: detailData.title || detailData.name,
        year: parseYear(detailData.release_date || detailData.first_air_date),
        tmdbId: detailData.id,
        poster: detailData.poster_path ? `${TMDB_IMAGE_BASE_URL}/w500${detailData.poster_path}` : undefined,
        backdrop: detailData.backdrop_path ? `${TMDB_IMAGE_BASE_URL}/w1280${detailData.backdrop_path}` : undefined,
        overview: detailData.overview,
        rating: detailData.vote_average,
        releaseDate: detailData.release_date || detailData.first_air_date,
        mediaType,
        genre: detailData.genres?.map((g: any) => g.name).join(", "),
        runtime: detailData.runtime || detailData.episode_run_time?.[0],
        imdbId: detailData.imdb_id,
        totalSeasons: detailData.number_of_seasons,
        totalEpisodes: detailData.number_of_episodes,
      }

      setSelectedMedia(media)
      setSearchQuery(media.title)

      // Reset TV show selections
      if (mediaType === "tv") {
        setSelectedSeason(1)
        setSelectedEpisode(1)
        setSelectedEpisodeData(null)
      } else {
        addToWatchHistory(media)
      }
    } catch (error) {
      console.error("Failed to load media:", error)
    }
  }

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

  const handleBrowseWithFilters = () => {
    const params = new URLSearchParams()
    if (searchQuery) params.set("q", searchQuery)
    if (filters.genre) params.set("genre", filters.genre)
    if (filters.yearFrom) params.set("year_from", filters.yearFrom)
    if (filters.yearTo) params.set("year_to", filters.yearTo)
    if (filters.minRating) params.set("min_rating", filters.minRating)
    if (filters.mediaType !== "all") params.set("media_type", filters.mediaType)

    router.push(`/browse?${params.toString()}`)
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
  }: { media: Media; showFavorite?: boolean; size?: "normal" | "large" }) => {
    const cardStyle: React.CSSProperties = {
      flexShrink: 0,
      cursor: "pointer",
      position: "relative",
      width: size === "large" ? "16rem" : "12rem",
      transition: "transform 0.3s ease",
    }

    const imageStyle: React.CSSProperties = {
      width: "100%",
      height: size === "large" ? "24rem" : "18rem",
      objectFit: "cover",
      border: "1px solid #333",
      borderRadius: "0.75rem",
      transition: "transform 0.3s ease",
    }

    const overlayStyle: React.CSSProperties = {
      position: "absolute",
      inset: 0,
      background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent, transparent)",
      opacity: 0,
      transition: "opacity 0.3s ease",
      borderRadius: "0.75rem",
    }

    const badgeStyle: React.CSSProperties = {
      position: "absolute",
      top: "0.5rem",
      left: "0.5rem",
      padding: "0.25rem 0.5rem",
      borderRadius: "9999px",
      fontSize: "0.75rem",
      fontWeight: "500",
      background: media.mediaType === "tv" ? "rgba(59, 130, 246, 0.8)" : "rgba(168, 85, 247, 0.8)",
      color: media.mediaType === "tv" ? "#dbeafe" : "#e9d5ff",
      display: "flex",
      alignItems: "center",
      gap: "0.25rem",
    }

    const titleStyle: React.CSSProperties = {
      fontWeight: "600",
      color: "white",
      fontSize: "0.875rem",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      marginTop: "0.75rem",
    }

    const metaStyle: React.CSSProperties = {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: "0.25rem",
    }

    const yearStyle: React.CSSProperties = {
      color: "#888",
      fontSize: "0.75rem",
    }

    const ratingStyle: React.CSSProperties = {
      display: "flex",
      alignItems: "center",
      color: "#eab308",
      fontSize: "0.75rem",
    }

    return (
      <div
        style={cardStyle}
        onClick={() => selectMedia(media)}
        onMouseEnter={(e) => {
          const img = e.currentTarget.querySelector("img") as HTMLImageElement
          const overlay = e.currentTarget.querySelector(".overlay") as HTMLDivElement
          if (img) img.style.transform = "scale(1.05)"
          if (overlay) overlay.style.opacity = "1"
        }}
        onMouseLeave={(e) => {
          const img = e.currentTarget.querySelector("img") as HTMLImageElement
          const overlay = e.currentTarget.querySelector(".overlay") as HTMLDivElement
          if (img) img.style.transform = "scale(1)"
          if (overlay) overlay.style.opacity = "0"
        }}
      >
        <div style={{ position: "relative", overflow: "hidden", borderRadius: "0.75rem" }}>
          <img
            src={media.poster || "/placeholder.svg?height=300&width=200"}
            alt={media.title}
            style={imageStyle}
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = "/placeholder.svg?height=300&width=200"
            }}
          />
          <div className="overlay" style={overlayStyle} />

          {/* Media Type Badge */}
          <div style={badgeStyle}>
            {media.mediaType === "tv" ? (
              <>
                <Tv style={{ width: "0.75rem", height: "0.75rem" }} />
                TV
              </>
            ) : (
              <>
                <Film style={{ width: "0.75rem", height: "0.75rem" }} />
                Movie
              </>
            )}
          </div>

          {showFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleToggleFavorite(media)
              }}
              style={{
                position: "absolute",
                top: "0.5rem",
                right: "0.5rem",
                padding: "0.5rem",
                background: "rgba(0, 0, 0, 0.7)",
                borderRadius: "9999px",
                border: "none",
                cursor: "pointer",
                transition: "background 0.3s ease",
              }}
            >
              <Heart
                style={{
                  width: "1rem",
                  height: "1rem",
                  color: favorites.includes(media.tmdbId) ? "#ef4444" : "white",
                  fill: favorites.includes(media.tmdbId) ? "#ef4444" : "none",
                }}
              />
            </button>
          )}
        </div>
        <div style={titleStyle}>{media.title}</div>
        <div style={metaStyle}>
          <p style={yearStyle}>{media.year}</p>
          {media.rating && (
            <div style={ratingStyle}>
              <Star style={{ width: "0.75rem", height: "0.75rem", marginRight: "0.25rem" }} />
              <span>{media.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  const getPlayerUrl = () => {
    if (!selectedMedia) return ""

    if (selectedMedia.mediaType === "tv") {
      return `https://player.videasy.net/tv/${selectedMedia.tmdbId}/${selectedSeason}/${selectedEpisode}`
    } else {
      return `https://player.videasy.net/movie/${selectedMedia.tmdbId}`
    }
  }

  if (isLoading) {
    return (
      <div style={containerStyle}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            color: "#a855f7",
            fontSize: "1.125rem",
          }}
        >
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <div style={{ maxWidth: "112rem", margin: "0 auto", padding: "2rem", position: "relative" }}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
            <div
              style={{
                width: "3rem",
                height: "3rem",
                background: "linear-gradient(135deg, #7c3aed, #ec4899)",
                borderRadius: "0.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "1rem",
              }}
            >
              <Play style={{ width: "1.5rem", height: "1.5rem", color: "white" }} />
            </div>
            <h1 style={titleStyle}>movie time</h1>
          </div>
          <p style={{ color: "#888", fontSize: "1.125rem", fontWeight: "normal", marginBottom: "0.5rem" }}>
            powered by videasy • unlimited streaming
          </p>
          <div style={{ opacity: 0.6, transition: "opacity 0.3s ease" }}>
            <a
              href="https://qou2.xyz"
              style={{
                color: "#666",
                fontSize: "0.875rem",
                textDecoration: "none",
                transition: "color 0.3s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#a855f7")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#666")}
            >
              ← back to qou2.xyz
            </a>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "1rem",
            marginBottom: "2rem",
            animation: "fadeInUp 0.8s ease-out 0.1s both",
          }}
        >
          <button
            onClick={() => (window.location.href = "/account")}
            style={{
              ...buttonStyle,
              background: "rgba(0, 0, 0, 0.6)",
              border: "2px solid rgba(168, 85, 247, 0.3)",
              color: "#a855f7",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(168, 85, 247, 0.2)"
              e.currentTarget.style.borderColor = "rgba(168, 85, 247, 0.5)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(0, 0, 0, 0.6)"
              e.currentTarget.style.borderColor = "rgba(168, 85, 247, 0.3)"
            }}
          >
            <User style={{ width: "1.25rem", height: "1.25rem" }} />
            <span>My Account</span>
          </button>
          <button
            onClick={() => (window.location.href = "/admin")}
            style={{
              ...buttonStyle,
              background: "rgba(0, 0, 0, 0.6)",
              border: "2px solid rgba(239, 68, 68, 0.3)",
              color: "#ef4444",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)"
              e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.5)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(0, 0, 0, 0.6)"
              e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)"
            }}
          >
            <Lock style={{ width: "1.25rem", height: "1.25rem" }} />
            <span>Admin</span>
          </button>
        </div>

        {/* Search Container */}
        <div ref={searchContainerRef} style={searchContainerStyle}>
          <div style={{ position: "relative" }}>
            <Search
              style={{
                position: "absolute",
                left: "1rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#a855f7",
                width: "1.25rem",
                height: "1.25rem",
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchQuery.length >= 2 && setShowAutocomplete(true)}
              style={searchInputStyle}
              placeholder="search for movies and TV shows..."
              autoComplete="off"
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(168, 85, 247, 0.5)"
                e.currentTarget.style.background = "rgba(0, 0, 0, 0.8)"
                e.currentTarget.style.transform = "translateY(-2px)"
                e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(168, 85, 247, 0.2)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(168, 85, 247, 0.3)"
                e.currentTarget.style.background = "rgba(0, 0, 0, 0.6)"
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = "none"
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#a855f7"
                e.currentTarget.style.background = "rgba(0, 0, 0, 0.8)"
                e.currentTarget.style.transform = "translateY(-2px)"
                e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(168, 85, 247, 0.2)"
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(168, 85, 247, 0.3)"
                e.currentTarget.style.background = "rgba(0, 0, 0, 0.6)"
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = "none"
              }}
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                position: "absolute",
                right: "1rem",
                top: "50%",
                transform: "translateY(-50%)",
                padding: "0.5rem",
                borderRadius: "0.75rem",
                border: "none",
                background: showFilters ? "#a855f7" : "transparent",
                color: showFilters ? "white" : "#666",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                if (!showFilters) {
                  e.currentTarget.style.color = "white"
                  e.currentTarget.style.background = "rgba(168, 85, 247, 0.2)"
                }
              }}
              onMouseLeave={(e) => {
                if (!showFilters) {
                  e.currentTarget.style.color = "#666"
                  e.currentTarget.style.background = "transparent"
                }
              }}
            >
              <Filter style={{ width: "1rem", height: "1rem" }} />
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div
              style={{
                marginTop: "1rem",
                padding: "1.5rem",
                background: "rgba(0, 0, 0, 0.8)",
                border: "2px solid rgba(168, 85, 247, 0.3)",
                borderRadius: "1rem",
                backdropFilter: "blur(12px)",
                position: "relative",
                zIndex: 50,
              }}
            >
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}
              >
                <h3 style={{ color: "white", fontWeight: "600" }}>Advanced Filters</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <button
                    onClick={handleBrowseWithFilters}
                    style={{
                      ...buttonStyle,
                      fontSize: "0.875rem",
                      padding: "0.5rem 1rem",
                    }}
                  >
                    Browse All Results
                  </button>
                  <button
                    onClick={clearFilters}
                    style={{
                      color: "#666",
                      fontSize: "0.875rem",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      transition: "color 0.3s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#666")}
                  >
                    <X style={{ width: "1rem", height: "1rem" }} />
                    Clear
                  </button>
                </div>
              </div>

              <div
                style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}
              >
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", color: "#888", marginBottom: "0.5rem" }}>
                    Content Type
                  </label>
                  <select
                    value={filters.mediaType}
                    onChange={(e) => setFilters({ ...filters, mediaType: e.target.value as "all" | "movie" | "tv" })}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      background: "rgba(0, 0, 0, 0.6)",
                      border: "1px solid rgba(168, 85, 247, 0.3)",
                      borderRadius: "0.75rem",
                      color: "white",
                      fontSize: "0.875rem",
                    }}
                  >
                    <option value="all">Movies & TV Shows</option>
                    <option value="movie">Movies Only</option>
                    <option value="tv">TV Shows Only</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", color: "#888", marginBottom: "0.5rem" }}>
                    Genre
                  </label>
                  <select
                    value={filters.genre}
                    onChange={(e) => setFilters({ ...filters, genre: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      background: "rgba(0, 0, 0, 0.6)",
                      border: "1px solid rgba(168, 85, 247, 0.3)",
                      borderRadius: "0.75rem",
                      color: "white",
                      fontSize: "0.875rem",
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
                  <label style={{ display: "block", fontSize: "0.875rem", color: "#888", marginBottom: "0.5rem" }}>
                    Min Rating
                  </label>
                  <select
                    value={filters.minRating}
                    onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      background: "rgba(0, 0, 0, 0.6)",
                      border: "1px solid rgba(168, 85, 247, 0.3)",
                      borderRadius: "0.75rem",
                      color: "white",
                      fontSize: "0.875rem",
                    }}
                  >
                    <option value="">Any Rating</option>
                    <option value="7">7.0+</option>
                    <option value="8">8.0+</option>
                    <option value="9">9.0+</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", color: "#888", marginBottom: "0.5rem" }}>
                    Year Range
                  </label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input
                      type="number"
                      value={filters.yearFrom}
                      onChange={(e) => setFilters({ ...filters, yearFrom: e.target.value })}
                      placeholder="From"
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        background: "rgba(0, 0, 0, 0.6)",
                        border: "1px solid rgba(168, 85, 247, 0.3)",
                        borderRadius: "0.75rem",
                        color: "white",
                        fontSize: "0.875rem",
                      }}
                    />
                    <input
                      type="number"
                      value={filters.yearTo}
                      onChange={(e) => setFilters({ ...filters, yearTo: e.target.value })}
                      placeholder="To"
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        background: "rgba(0, 0, 0, 0.6)",
                        border: "1px solid rgba(168, 85, 247, 0.3)",
                        borderRadius: "0.75rem",
                        color: "white",
                        fontSize: "0.875rem",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Autocomplete Dropdown */}
          {showAutocomplete && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                marginTop: "0.5rem",
                background: "rgba(0, 0, 0, 0.95)",
                border: "2px solid rgba(168, 85, 247, 0.3)",
                borderRadius: "1rem",
                backdropFilter: "blur(12px)",
                maxHeight: "24rem",
                overflowY: "auto",
                zIndex: 100,
              }}
            >
              {/* Search History */}
              {searchHistory.length > 0 && searchQuery.length === 0 && (
                <div style={{ padding: "1rem", borderBottom: "1px solid rgba(168, 85, 247, 0.2)" }}>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "0.75rem", color: "#a855f7" }}>
                    <Clock style={{ width: "1rem", height: "1rem", marginRight: "0.5rem" }} />
                    <span style={{ fontSize: "0.875rem" }}>Recent Searches</span>
                  </div>
                  {searchHistory.slice(0, 5).map((query, index) => (
                    <div
                      key={index}
                      onClick={() => setSearchQuery(query)}
                      style={{
                        padding: "0.5rem",
                        borderRadius: "0.75rem",
                        cursor: "pointer",
                        color: "#ccc",
                        fontSize: "0.875rem",
                        transition: "background 0.3s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(168, 85, 247, 0.2)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {query}
                    </div>
                  ))}
                </div>
              )}

              {isSearching ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "1.5rem",
                    color: "#a855f7",
                    animation: "pulse 2s infinite",
                  }}
                >
                  searching...
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((media) => (
                  <div
                    key={`${media.mediaType}-${media.tmdbId}`}
                    onClick={() => selectMedia(media)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "1rem",
                      cursor: "pointer",
                      borderBottom: "1px solid rgba(168, 85, 247, 0.2)",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(168, 85, 247, 0.2)"
                      e.currentTarget.style.transform = "translateX(4px)"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent"
                      e.currentTarget.style.transform = "translateX(0)"
                    }}
                  >
                    <img
                      src={media.poster || "/placeholder.svg?height=75&width=50"}
                      alt={media.title}
                      style={{
                        width: "3rem",
                        height: "4.5rem",
                        objectFit: "cover",
                        borderRadius: "0.5rem",
                        border: "1px solid rgba(168, 85, 247, 0.3)",
                        marginRight: "1rem",
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = "/placeholder.svg?height=75&width=50"
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", marginBottom: "0.25rem" }}>
                        <div style={{ fontWeight: "600", color: "white", marginRight: "0.5rem" }}>{media.title}</div>
                        <div
                          style={{
                            padding: "0.25rem 0.5rem",
                            borderRadius: "9999px",
                            fontSize: "0.75rem",
                            fontWeight: "500",
                            background:
                              media.mediaType === "tv" ? "rgba(59, 130, 246, 0.8)" : "rgba(168, 85, 247, 0.8)",
                            color: media.mediaType === "tv" ? "#dbeafe" : "#e9d5ff",
                          }}
                        >
                          {media.mediaType === "tv" ? "TV" : "Movie"}
                        </div>
                      </div>
                      <div style={{ color: "#888", fontSize: "0.875rem", display: "flex", alignItems: "center" }}>
                        <Calendar style={{ width: "0.75rem", height: "0.75rem", marginRight: "0.25rem" }} />
                        {media.year}
                        {media.rating && (
                          <>
                            <Star
                              style={{
                                width: "0.75rem",
                                height: "0.75rem",
                                marginLeft: "0.75rem",
                                marginRight: "0.25rem",
                                color: "#eab308",
                              }}
                            />
                            <span style={{ color: "#eab308" }}>{media.rating.toFixed(1)}</span>
                          </>
                        )}
                      </div>
                      {media.overview && (
                        <div
                          style={{
                            color: "#666",
                            fontSize: "0.75rem",
                            marginTop: "0.25rem",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {media.overview}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : searchQuery.length >= 2 ? (
                <div style={{ textAlign: "center", padding: "1.5rem", color: "#888" }}>no content found</div>
              ) : null}
            </div>
          )}
        </div>

        {/* Trending Content */}
        {!selectedMedia && trendingMedia.length > 0 && (
          <div style={{ marginBottom: "3rem", position: "relative", zIndex: 10 }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "2rem" }}>
              <div
                style={{
                  width: "0.25rem",
                  height: "2rem",
                  background: "linear-gradient(to bottom, #a855f7, #ec4899)",
                  borderRadius: "9999px",
                  marginRight: "1rem",
                }}
              />
              <h2 style={{ fontSize: "1.875rem", fontWeight: "bold", color: "white" }}>Trending This Week</h2>
            </div>
            <div style={{ display: "flex", gap: "1.5rem", overflowX: "auto", paddingBottom: "1rem" }}>
              {trendingMedia.map((media) => (
                <MediaCard key={`${media.mediaType}-${media.tmdbId}`} media={media} showFavorite size="large" />
              ))}
            </div>
          </div>
        )}

        {/* Recommended Content */}
        {!selectedMedia && recommendedMedia.length > 0 && (
          <div style={{ marginBottom: "3rem", position: "relative", zIndex: 10 }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "2rem" }}>
              <Heart style={{ width: "1.5rem", height: "1.5rem", marginRight: "0.75rem", color: "#ec4899" }} />
              <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "white" }}>
                {watchHistory.length > 0 ? "Recommended for You" : "Popular Content"}
              </h2>
            </div>
            <div style={{ display: "flex", gap: "1rem", overflowX: "auto", paddingBottom: "1rem" }}>
              {recommendedMedia.map((media) => (
                <MediaCard key={`${media.mediaType}-${media.tmdbId}`} media={media} showFavorite />
              ))}
            </div>
          </div>
        )}

        {/* Continue Watching */}
        {!selectedMedia && watchHistory.length > 0 && (
          <div style={{ marginBottom: "3rem", position: "relative", zIndex: 10 }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "2rem" }}>
              <Clock style={{ width: "1.5rem", height: "1.5rem", marginRight: "0.75rem", color: "#3b82f6" }} />
              <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "white" }}>Continue Watching</h2>
            </div>
            <div style={{ display: "flex", gap: "1rem", overflowX: "auto", paddingBottom: "1rem" }}>
              {watchHistory.slice(0, 6).map((media, index) => (
                <MediaCard key={`${media.mediaType}-${media.tmdbId}-${index}`} media={media} showFavorite />
              ))}
            </div>
          </div>
        )}

        {/* Player Container */}
        <div style={cardStyle}>
          {selectedMedia ? (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "2rem",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "0.75rem" }}>
                    <h2 style={{ fontSize: "2.25rem", fontWeight: "bold", color: "white", marginRight: "1rem" }}>
                      {selectedMedia.title}
                    </h2>
                    <div
                      style={{
                        padding: "0.5rem 0.75rem",
                        borderRadius: "9999px",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        background:
                          selectedMedia.mediaType === "tv" ? "rgba(59, 130, 246, 0.8)" : "rgba(168, 85, 247, 0.8)",
                        color: selectedMedia.mediaType === "tv" ? "#dbeafe" : "#e9d5ff",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                    >
                      {selectedMedia.mediaType === "tv" ? (
                        <>
                          <Tv style={{ width: "1rem", height: "1rem" }} />
                          TV Show
                        </>
                      ) : (
                        <>
                          <Film style={{ width: "1rem", height: "1rem" }} />
                          Movie
                        </>
                      )}
                    </div>
                  </div>

                  {/* Episode info for TV shows */}
                  {selectedMedia.mediaType === "tv" && selectedEpisodeData && (
                    <div style={{ marginBottom: "1rem" }}>
                      <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#a855f7", marginBottom: "0.25rem" }}>
                        Season {selectedSeason}, Episode {selectedEpisode}
                      </h3>
                      <h4 style={{ fontSize: "1.125rem", color: "white" }}>{selectedEpisodeData.name}</h4>
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      color: "#888",
                      fontSize: "0.875rem",
                      gap: "1.5rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <span
                      style={{
                        padding: "0.5rem 0.75rem",
                        background: "rgba(168, 85, 247, 0.2)",
                        borderRadius: "9999px",
                        color: "#a855f7",
                        fontSize: "0.75rem",
                        fontWeight: "500",
                      }}
                    >
                      NOW PLAYING
                    </span>
                    {selectedMedia.year && (
                      <span style={{ display: "flex", alignItems: "center" }}>
                        <Calendar style={{ width: "1rem", height: "1rem", marginRight: "0.25rem" }} />
                        {selectedMedia.year}
                      </span>
                    )}
                    {selectedMedia.rating && (
                      <span style={{ display: "flex", alignItems: "center", color: "#eab308" }}>
                        <Star style={{ width: "1rem", height: "1rem", marginRight: "0.25rem" }} />
                        {selectedMedia.rating.toFixed(1)}
                      </span>
                    )}
                    {selectedMedia.runtime && (
                      <span style={{ display: "flex", alignItems: "center" }}>
                        <Clock style={{ width: "1rem", height: "1rem", marginRight: "0.25rem" }} />
                        {selectedMedia.runtime}min
                      </span>
                    )}
                  </div>
                  {selectedMedia.genre && (
                    <div style={{ color: "#a855f7", fontSize: "0.875rem", marginBottom: "0.75rem" }}>
                      {selectedMedia.genre}
                    </div>
                  )}
                  {(selectedEpisodeData?.overview || selectedMedia.overview) && (
                    <p style={{ color: "#ccc", fontSize: "0.875rem", lineHeight: "1.6", maxWidth: "48rem" }}>
                      {selectedEpisodeData?.overview || selectedMedia.overview}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleToggleFavorite(selectedMedia)}
                  style={{
                    padding: "1rem",
                    background: "rgba(0, 0, 0, 0.7)",
                    borderRadius: "1rem",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(0, 0, 0, 0.9)"
                    e.currentTarget.style.transform = "scale(1.05)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(0, 0, 0, 0.7)"
                    e.currentTarget.style.transform = "scale(1)"
                  }}
                >
                  <Heart
                    style={{
                      width: "1.5rem",
                      height: "1.5rem",
                      color: favorites.includes(selectedMedia.tmdbId) ? "#ef4444" : "white",
                      fill: favorites.includes(selectedMedia.tmdbId) ? "#ef4444" : "none",
                    }}
                  />
                </button>
              </div>

              {/* Season/Episode Selector for TV Shows */}
              {selectedMedia.mediaType === "tv" && selectedMedia.totalSeasons && (
                <div style={{ marginBottom: "2rem" }}>
                  <SeasonEpisodeSelector
                    tmdbId={selectedMedia.tmdbId}
                    totalSeasons={selectedMedia.totalSeasons}
                    onEpisodeSelect={handleEpisodeSelect}
                    currentSeason={selectedSeason}
                    currentEpisode={selectedEpisode}
                  />
                </div>
              )}

              <div style={playerContainerStyle}>
                <iframe
                  src={getPlayerUrl()}
                  style={iframeStyle}
                  allowFullScreen
                  allow="encrypted-media"
                  title={selectedMedia.mediaType === "tv" ? "TV Show Player" : "Movie Player"}
                />
              </div>
              <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
                <p style={{ color: "#666", fontSize: "0.75rem" }}>
                  Powered by <span style={{ color: "#a855f7", fontWeight: "500" }}>Videasy</span> • High-quality
                  streaming with no ads
                </p>
              </div>
            </>
          ) : (
            <div style={playerContainerStyle}>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: "5rem",
                    height: "5rem",
                    background: "linear-gradient(135deg, #7c3aed, #ec4899)",
                    borderRadius: "1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "1.5rem",
                  }}
                >
                  <Play style={{ width: "2.5rem", height: "2.5rem", color: "white" }} />
                </div>
                <div style={{ color: "white", fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                  Ready to Watch?
                </div>
                <div style={{ color: "#888", fontSize: "1.125rem" }}>
                  Search and select movies or TV shows to start streaming
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
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
