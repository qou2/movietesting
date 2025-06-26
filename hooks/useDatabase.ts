"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth-guard"

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

export function useDatabase() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<number[]>([])
  const [watchHistory, setWatchHistory] = useState<Media[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadUserData(user.id)
    } else {
      setFavorites([])
      setWatchHistory([])
      setIsLoading(false)
    }
  }, [user])

  const loadUserData = async (userId: string) => {
    console.log("📊 Loading user data for:", userId)
    setIsLoading(true)

    try {
      // Load favorites
      const { data: favoritesData, error: favError } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (favError) {
        console.error("❌ Error loading favorites:", favError)
      } else {
        console.log("💖 Loaded favorites:", favoritesData?.length || 0, "items")
        setFavorites(favoritesData?.map((f) => f.tmdb_id).filter(Boolean) || [])
      }

      // Load watch history
      const { data: historyData, error: histError } = await supabase
        .from("watch_history")
        .select("*")
        .eq("user_id", userId)
        .order("last_watched", { ascending: false })
        .limit(20)

      if (histError) {
        console.error("❌ Error loading watch history:", histError)
      } else {
        console.log("🎬 Loaded watch history:", historyData?.length || 0, "items")

        const media =
          historyData?.map((h) => ({
            title: h.movie_title,
            year: h.movie_year,
            tmdbId: h.tmdb_id,
            imdbId: h.imdb_id || undefined,
            poster: h.movie_poster || undefined,
            backdrop: h.movie_backdrop || undefined,
            genre: h.movie_genre || undefined,
            overview: h.movie_plot || undefined,
            rating: h.movie_rating ? Number.parseFloat(h.movie_rating) : undefined,
            releaseDate: h.release_date || undefined,
            runtime: h.runtime || undefined,
            mediaType: (h.media_type as "movie" | "tv") || "movie",
            seasonNumber: h.season_number || undefined,
            episodeNumber: h.episode_number || undefined,
            totalSeasons: h.total_seasons || undefined,
            totalEpisodes: h.total_episodes || undefined,
            episodeTitle: h.episode_title || undefined,
            seasonTitle: h.season_title || undefined,
          })) || []

        setWatchHistory(media)
      }
    } catch (error) {
      console.error("💥 Error loading user data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const addToWatchHistory = async (media: Media) => {
    if (!user) {
      console.log("❌ No user available for watch history")
      return
    }

    console.log("🎬 Adding to watch history:", media.title, "TMDB ID:", media.tmdbId, "Type:", media.mediaType)

    try {
      // Remove existing entry if it exists (for the same episode/movie)
      let deleteQuery = supabase.from("watch_history").delete().eq("user_id", user.id).eq("tmdb_id", media.tmdbId)

      // For TV shows, also match season and episode
      if (media.mediaType === "tv" && media.seasonNumber && media.episodeNumber) {
        deleteQuery = deleteQuery.eq("season_number", media.seasonNumber).eq("episode_number", media.episodeNumber)
      }

      const { error: deleteError } = await deleteQuery

      if (deleteError) {
        console.error("❌ Error deleting existing entry:", deleteError)
      }

      // Prepare the data to insert
      const insertData = {
        user_id: user.id,
        tmdb_id: media.tmdbId,
        imdb_id: media.imdbId || null,
        movie_title: media.title,
        movie_year: media.year,
        movie_poster: media.poster || null,
        movie_backdrop: media.backdrop || null,
        movie_genre: media.genre || null,
        movie_plot: media.overview || null,
        movie_rating: media.rating?.toString() || null,
        release_date: media.releaseDate || null,
        runtime: media.runtime || null,
        media_type: media.mediaType,
        season_number: media.seasonNumber || null,
        episode_number: media.episodeNumber || null,
        total_seasons: media.totalSeasons || null,
        total_episodes: media.totalEpisodes || null,
        episode_title: media.episodeTitle || null,
        season_title: media.seasonTitle || null,
        last_watched: new Date().toISOString(),
      }

      console.log("📝 Inserting data:", insertData)

      // Add new entry
      const { data, error } = await supabase.from("watch_history").insert(insertData).select()

      if (error) {
        console.error("❌ Error adding to watch history:", error)
        return
      }

      console.log("✅ Successfully added to watch history:", data)

      // Update local state
      setWatchHistory((prev) =>
        [
          media,
          ...prev.filter(
            (m) =>
              !(
                m.tmdbId === media.tmdbId &&
                m.seasonNumber === media.seasonNumber &&
                m.episodeNumber === media.episodeNumber
              ),
          ),
        ].slice(0, 20),
      )
    } catch (error) {
      console.error("💥 Unexpected error adding to watch history:", error)
    }
  }

  const toggleFavorite = async (media: Media) => {
    if (!user) {
      console.log("❌ No user available for favorites")
      return
    }

    console.log("💖 Toggling favorite for:", media.title)

    if (favorites.includes(media.tmdbId)) {
      // Remove from favorites
      const { error } = await supabase.from("favorites").delete().eq("user_id", user.id).eq("tmdb_id", media.tmdbId)

      if (error) {
        console.error("❌ Error removing from favorites:", error)
      } else {
        console.log("✅ Removed from favorites")
        setFavorites((prev) => prev.filter((id) => id !== media.tmdbId))
      }
    } else {
      // Add to favorites
      const insertData = {
        user_id: user.id,
        tmdb_id: media.tmdbId,
        imdb_id: media.imdbId || null,
        movie_title: media.title,
        movie_year: media.year,
        movie_poster: media.poster || null,
        movie_backdrop: media.backdrop || null,
        media_type: media.mediaType,
        season_number: media.seasonNumber || null,
        episode_number: media.episodeNumber || null,
        total_seasons: media.totalSeasons || null,
        total_episodes: media.totalEpisodes || null,
      }

      const { error } = await supabase.from("favorites").insert(insertData)

      if (error) {
        console.error("❌ Error adding to favorites:", error)
      } else {
        console.log("✅ Added to favorites")
        setFavorites((prev) => [...prev, media.tmdbId])
      }
    }
  }

  const getFavoriteMedia = async (): Promise<Media[]> => {
    if (!user) return []

    try {
      const { data } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      return (
        data?.map((f) => ({
          title: f.movie_title,
          year: f.movie_year,
          tmdbId: f.tmdb_id,
          imdbId: f.imdb_id || undefined,
          poster: f.movie_poster || undefined,
          backdrop: f.movie_backdrop || undefined,
          mediaType: (f.media_type as "movie" | "tv") || "movie",
          seasonNumber: f.season_number || undefined,
          episodeNumber: f.episode_number || undefined,
          totalSeasons: f.total_seasons || undefined,
          totalEpisodes: f.total_episodes || undefined,
        })) || []
      )
    } catch (error) {
      console.error("Error getting favorite media:", error)
      return []
    }
  }

  return {
    userId: user?.id || "",
    username: user?.username || "",
    favorites,
    watchHistory,
    isLoading,
    toggleFavorite,
    addToWatchHistory,
    getFavoriteMedia,
    updateUsername: async () => ({ success: false, error: "Use account settings to update username" }),
    loadUserData: () => user && loadUserData(user.id),
  }
}
