"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { ChevronDown, Play, Clock, Calendar, Star } from "lucide-react"

interface Episode {
  id: number
  name: string
  overview: string
  episode_number: number
  air_date: string
  runtime: number
  still_path: string | null
  vote_average: number
}

interface Season {
  id: number
  name: string
  overview: string
  season_number: number
  episode_count: number
  air_date: string
  poster_path: string | null
}

interface SeasonEpisodeSelectorProps {
  tmdbId: number
  totalSeasons: number
  onEpisodeSelect: (season: number, episode: number, episodeData: Episode) => void
  currentSeason?: number
  currentEpisode?: number
}

const TMDB_ACCESS_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmZDllMzlkNGJhNGEwZDg3OGJhMzY5ZTM5NzkzYjVmOCIsIm5iZiI6MTc1MDc0NDI3MS41MDIsInN1YiI6IjY4NWEzY2NmODk4NDFiZTJhODRmNmE5ZiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.einV7s-uINbA8P9uXQixNmB9ALAIEjDbhfOXuX4wn5I"
const TMDB_BASE_URL = "https://api.themoviedb.org/3"
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p"

export default function SeasonEpisodeSelector({
  tmdbId,
  totalSeasons,
  onEpisodeSelect,
  currentSeason = 1,
  currentEpisode = 1,
}: SeasonEpisodeSelectorProps) {
  const [selectedSeason, setSelectedSeason] = useState(currentSeason)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false)
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false)

  // Inline styles
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
  }

  const seasonSelectorStyle: React.CSSProperties = {
    position: "relative",
  }

  const seasonButtonStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(0, 0, 0, 0.6)",
    border: "2px solid rgba(168, 85, 247, 0.3)",
    borderRadius: "0.75rem",
    padding: "0.75rem 1rem",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontSize: "1rem",
    fontWeight: "500",
  }

  const seasonButtonHoverStyle: React.CSSProperties = {
    ...seasonButtonStyle,
    borderColor: "rgba(168, 85, 247, 0.6)",
    background: "rgba(168, 85, 247, 0.1)",
  }

  const dropdownStyle: React.CSSProperties = {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: "0.5rem",
    background: "rgba(0, 0, 0, 0.95)",
    border: "2px solid rgba(168, 85, 247, 0.3)",
    borderRadius: "0.75rem",
    backdropFilter: "blur(12px)",
    maxHeight: "15rem",
    overflowY: "auto",
    zIndex: 50,
  }

  const dropdownItemStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.75rem 1rem",
    textAlign: "left",
    background: "transparent",
    border: "none",
    color: "white",
    cursor: "pointer",
    transition: "all 0.3s ease",
    borderBottom: "1px solid rgba(168, 85, 247, 0.2)",
  }

  const dropdownItemHoverStyle: React.CSSProperties = {
    ...dropdownItemStyle,
    background: "rgba(168, 85, 247, 0.2)",
  }

  const episodesSectionStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  }

  const episodesTitleStyle: React.CSSProperties = {
    color: "white",
    fontWeight: "600",
    fontSize: "1.125rem",
    margin: 0,
  }

  const episodesListStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    maxHeight: "24rem",
    overflowY: "auto",
    paddingRight: "0.5rem",
  }

  const episodeCardStyle: React.CSSProperties = {
    background: "rgba(0, 0, 0, 0.4)",
    border: "1px solid rgba(168, 85, 247, 0.2)",
    borderRadius: "0.75rem",
    padding: "1rem",
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "flex-start",
    gap: "1rem",
  }

  const episodeCardHoverStyle: React.CSSProperties = {
    ...episodeCardStyle,
    borderColor: "rgba(168, 85, 247, 0.5)",
    background: "rgba(0, 0, 0, 0.6)",
    transform: "translateY(-2px)",
  }

  const episodeCardActiveStyle: React.CSSProperties = {
    ...episodeCardStyle,
    borderColor: "rgba(168, 85, 247, 1)",
    background: "rgba(168, 85, 247, 0.2)",
  }

  const thumbnailContainerStyle: React.CSSProperties = {
    position: "relative",
    flexShrink: 0,
  }

  const thumbnailStyle: React.CSSProperties = {
    width: "6rem",
    height: "3.5rem",
    objectFit: "cover",
    borderRadius: "0.5rem",
    border: "1px solid rgba(168, 85, 247, 0.3)",
  }

  const playOverlayStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    background: "rgba(0, 0, 0, 0.5)",
    opacity: 0,
    transition: "opacity 0.3s ease",
    borderRadius: "0.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }

  const episodeInfoStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  }

  const episodeTitleStyle: React.CSSProperties = {
    color: "white",
    fontWeight: "500",
    fontSize: "0.875rem",
    marginBottom: "0.25rem",
    display: "-webkit-box",
    WebkitLineClamp: 1,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  }

  const episodeMetaStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    fontSize: "0.75rem",
    color: "#888",
    marginBottom: "0.5rem",
  }

  const episodeOverviewStyle: React.CSSProperties = {
    color: "#ccc",
    fontSize: "0.75rem",
    lineHeight: "1.4",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  }

  const loadingStyle: React.CSSProperties = {
    textAlign: "center",
    padding: "2rem 0",
    color: "#a855f7",
    fontSize: "1rem",
  }

  const noEpisodesStyle: React.CSSProperties = {
    textAlign: "center",
    padding: "2rem 0",
    color: "#888",
    fontSize: "1rem",
  }

  // Load seasons on mount
  useEffect(() => {
    loadSeasons()
  }, [tmdbId])

  // Load episodes when season changes
  useEffect(() => {
    if (selectedSeason > 0) {
      loadEpisodes(selectedSeason)
    }
  }, [selectedSeason, tmdbId])

  const loadSeasons = async () => {
    try {
      const response = await fetch(`${TMDB_BASE_URL}/tv/${tmdbId}`, {
        headers: {
          Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      })
      const data = await response.json()

      if (data.seasons) {
        // Filter out season 0 (specials) unless it's the only season
        const filteredSeasons = data.seasons.filter(
          (season: Season) => season.season_number > 0 || data.seasons.length === 1,
        )
        setSeasons(filteredSeasons)
      }
    } catch (error) {
      console.error("Failed to load seasons:", error)
    }
  }

  const loadEpisodes = async (seasonNumber: number) => {
    setIsLoadingEpisodes(true)
    try {
      const response = await fetch(`${TMDB_BASE_URL}/tv/${tmdbId}/season/${seasonNumber}`, {
        headers: {
          Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      })
      const data = await response.json()

      if (data.episodes) {
        setEpisodes(data.episodes)
      }
    } catch (error) {
      console.error("Failed to load episodes:", error)
      setEpisodes([])
    }
    setIsLoadingEpisodes(false)
  }

  const handleSeasonChange = (seasonNumber: number) => {
    setSelectedSeason(seasonNumber)
    setShowSeasonDropdown(false)
  }

  const handleEpisodeSelect = (episode: Episode) => {
    onEpisodeSelect(selectedSeason, episode.episode_number, episode)
  }

  const formatRuntime = (runtime: number) => {
    if (!runtime) return ""
    const hours = Math.floor(runtime / 60)
    const minutes = runtime % 60
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return ""
    }
  }

  return (
    <div style={containerStyle}>
      {/* Season Selector */}
      <div style={seasonSelectorStyle}>
        <button
          onClick={() => setShowSeasonDropdown(!showSeasonDropdown)}
          style={seasonButtonStyle}
          onMouseEnter={(e) => {
            Object.assign(e.currentTarget.style, seasonButtonHoverStyle)
          }}
          onMouseLeave={(e) => {
            Object.assign(e.currentTarget.style, seasonButtonStyle)
          }}
        >
          <span>{seasons.find((s) => s.season_number === selectedSeason)?.name || `Season ${selectedSeason}`}</span>
          <ChevronDown
            style={{
              width: "1.25rem",
              height: "1.25rem",
              transition: "transform 0.3s ease",
              transform: showSeasonDropdown ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </button>

        {showSeasonDropdown && (
          <div style={dropdownStyle}>
            {seasons.map((season) => (
              <button
                key={season.id}
                onClick={() => handleSeasonChange(season.season_number)}
                style={{
                  ...dropdownItemStyle,
                  background: selectedSeason === season.season_number ? "rgba(168, 85, 247, 0.3)" : "transparent",
                  color: selectedSeason === season.season_number ? "#a855f7" : "white",
                }}
                onMouseEnter={(e) => {
                  if (selectedSeason !== season.season_number) {
                    Object.assign(e.currentTarget.style, dropdownItemHoverStyle)
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedSeason !== season.season_number) {
                    Object.assign(e.currentTarget.style, dropdownItemStyle)
                  }
                }}
              >
                <div style={{ fontWeight: "500" }}>{season.name}</div>
                <div style={{ fontSize: "0.875rem", color: "#888" }}>{season.episode_count} episodes</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Episodes List */}
      <div style={episodesSectionStyle}>
        <h3 style={episodesTitleStyle}>Episodes</h3>

        {isLoadingEpisodes ? (
          <div style={loadingStyle}>Loading episodes...</div>
        ) : episodes.length > 0 ? (
          <div style={episodesListStyle}>
            {episodes.map((episode) => {
              const isActive = currentEpisode === episode.episode_number
              const cardStyle = isActive ? episodeCardActiveStyle : episodeCardStyle

              return (
                <div
                  key={episode.id}
                  onClick={() => handleEpisodeSelect(episode)}
                  style={cardStyle}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      Object.assign(e.currentTarget.style, episodeCardHoverStyle)
                      const overlay = e.currentTarget.querySelector("[data-play-overlay]") as HTMLElement
                      if (overlay) overlay.style.opacity = "1"
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      Object.assign(e.currentTarget.style, episodeCardStyle)
                      const overlay = e.currentTarget.querySelector("[data-play-overlay]") as HTMLElement
                      if (overlay) overlay.style.opacity = "0"
                    }
                  }}
                >
                  {/* Episode Thumbnail */}
                  <div style={thumbnailContainerStyle}>
                    <img
                      src={
                        episode.still_path
                          ? `${TMDB_IMAGE_BASE_URL}/w300${episode.still_path}`
                          : "/placeholder.svg?height=56&width=96"
                      }
                      alt={episode.name}
                      style={thumbnailStyle}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = "/placeholder.svg?height=56&width=96"
                      }}
                    />
                    <div style={playOverlayStyle} data-play-overlay>
                      <Play style={{ width: "1.5rem", height: "1.5rem", color: "white" }} />
                    </div>
                  </div>

                  {/* Episode Info */}
                  <div style={episodeInfoStyle}>
                    <h4 style={episodeTitleStyle}>
                      {episode.episode_number}. {episode.name}
                    </h4>
                    <div style={episodeMetaStyle}>
                      {episode.runtime && (
                        <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <Clock style={{ width: "0.75rem", height: "0.75rem" }} />
                          {formatRuntime(episode.runtime)}
                        </span>
                      )}
                      {episode.air_date && (
                        <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <Calendar style={{ width: "0.75rem", height: "0.75rem" }} />
                          {formatDate(episode.air_date)}
                        </span>
                      )}
                      {episode.vote_average > 0 && (
                        <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "#fbbf24" }}>
                          <Star style={{ width: "0.75rem", height: "0.75rem" }} />
                          {episode.vote_average.toFixed(1)}
                        </span>
                      )}
                    </div>

                    {episode.overview && <p style={episodeOverviewStyle}>{episode.overview}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={noEpisodesStyle}>No episodes found for this season</div>
        )}
      </div>
    </div>
  )
}
