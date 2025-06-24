"use client"
import { useState, useEffect } from "react"
import { ChevronDown, Play, Clock, Calendar } from "lucide-react"

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
    <div className="space-y-6">
      {/* Season Selector */}
      <div className="relative">
        <button
          onClick={() => setShowSeasonDropdown(!showSeasonDropdown)}
          className="w-full bg-black/60 border-2 border-purple-500/30 rounded-xl px-4 py-3 text-white flex items-center justify-between hover:border-purple-500 transition-colors"
        >
          <span className="font-medium">
            {seasons.find((s) => s.season_number === selectedSeason)?.name || `Season ${selectedSeason}`}
          </span>
          <ChevronDown className={`w-5 h-5 transition-transform ${showSeasonDropdown ? "rotate-180" : ""}`} />
        </button>

        {showSeasonDropdown && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-black/95 border-2 border-purple-500/30 rounded-xl backdrop-blur-xl max-h-60 overflow-y-auto z-50">
            {seasons.map((season) => (
              <button
                key={season.id}
                onClick={() => handleSeasonChange(season.season_number)}
                className={`w-full px-4 py-3 text-left hover:bg-purple-600/20 transition-colors border-b border-purple-500/20 last:border-b-0 ${
                  selectedSeason === season.season_number ? "bg-purple-600/30 text-purple-300" : "text-white"
                }`}
              >
                <div className="font-medium">{season.name}</div>
                <div className="text-sm text-[#888]">{season.episode_count} episodes</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Episodes List */}
      <div className="space-y-3">
        <h3 className="text-white font-semibold text-lg">Episodes</h3>

        {isLoadingEpisodes ? (
          <div className="text-center py-8 text-purple-400 animate-pulse">Loading episodes...</div>
        ) : episodes.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {episodes.map((episode) => (
              <div
                key={episode.id}
                onClick={() => handleEpisodeSelect(episode)}
                className={`bg-black/40 border border-purple-500/20 rounded-xl p-4 cursor-pointer hover:border-purple-500/50 hover:bg-black/60 transition-all duration-300 group ${
                  currentEpisode === episode.episode_number ? "border-purple-500 bg-purple-600/20" : ""
                }`}
              >
                <div className="flex items-start space-x-4">
                  {/* Episode Thumbnail */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={
                        episode.still_path
                          ? `${TMDB_IMAGE_BASE_URL}/w300${episode.still_path}`
                          : "/placeholder.svg?height=90&width=160"
                      }
                      alt={episode.name}
                      className="w-24 h-14 object-cover rounded-lg border border-purple-500/30"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = "/placeholder.svg?height=90&width=160"
                      }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  {/* Episode Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-white font-medium text-sm mb-1 line-clamp-1">
                          {episode.episode_number}. {episode.name}
                        </h4>
                        <div className="flex items-center space-x-3 text-xs text-[#888]">
                          {episode.runtime && (
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatRuntime(episode.runtime)}
                            </span>
                          )}
                          {episode.air_date && (
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(episode.air_date)}
                            </span>
                          )}
                          {episode.vote_average > 0 && (
                            <span className="text-yellow-500">★ {episode.vote_average.toFixed(1)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {episode.overview && (
                      <p className="text-[#ccc] text-xs line-clamp-2 leading-relaxed">{episode.overview}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-[#888]">No episodes found for this season</div>
        )}
      </div>

      <style jsx>{`
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
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
