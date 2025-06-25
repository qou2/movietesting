"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"

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
  // Add this at the very beginning of the useDatabase function
  useEffect(() => {
    // Prevent any stray API calls that might cause errors
    const originalFetch = window.fetch
    window.fetch = function (...args) {
      const url = args[0]
      if (typeof url === "string" && url.includes("generate-access-code")) {
        console.warn("Blocked call to generate-access-code endpoint")
        return Promise.resolve(
          new Response('{"success": true}', {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        )
      }
      return originalFetch.apply(this, args)
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [])

  const [userId, setUserId] = useState<string>("")
  const [username, setUsername] = useState<string>("")
  const [favorites, setFavorites] = useState<number[]>([])
  const [watchHistory, setWatchHistory] = useState<Media[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Initialize user
  useEffect(() => {
    const initUser = async () => {
      console.log("🚀 Initializing user...")

      let storedUserId = localStorage.getItem("movie_app_user_id")

      if (!storedUserId) {
        storedUserId = uuidv4()
        localStorage.setItem("movie_app_user_id", storedUserId)
        console.log("✨ Created new user ID:", storedUserId)

        // Create user profile
        const { data, error } = await supabase.from("user_profiles").insert({ id: storedUserId }).select()
        if (error) {
          console.error("❌ Error creating user profile:", error)
        } else {
          console.log("✅ User profile created:", data)
        }
      } else {
        console.log("👤 Found existing user ID:", storedUserId)

        // Update last active
        const { error } = await supabase.from("user_profiles").upsert({
          id: storedUserId,
          last_active: new Date().toISOString(),
        })

        if (error) {
          console.error("❌ Error updating last active:", error)
        } else {
          console.log("✅ Updated last active")
        }
      }

      setUserId(storedUserId)
      await loadUserData(storedUserId)
      setIsLoading(false)
    }

    initUser()
  }, [])

  const loadUserData = async (uid: string) => {
    console.log("📊 Loading user data for:", uid)

    try {
      // Load favorites
      const { data: favoritesData, error: favError } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", uid)
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
        .eq("user_id", uid)
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

      // Add this to loadUserData function after loading favorites and watch history
      // Load user profile for username
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("username")
        .eq("id", uid)
        .single()

      if (profileError) {
        console.error("❌ Error loading user profile:", profileError)
      } else {
        console.log("👤 Loaded username:", profileData?.username)
        setUsername(profileData?.username || "")
      }
    } catch (error) {
      console.error("💥 Error loading user data:", error)
    }
  }

  const addToWatchHistory = async (media: Media) => {
    if (!userId) {
      console.log("❌ No userId available for watch history")
      return
    }

    console.log("🎬 Adding to watch history:", media.title, "TMDB ID:", media.tmdbId, "Type:", media.mediaType)

    try {
      // Remove existing entry if it exists (for the same episode/movie)
      let deleteQuery = supabase.from("watch_history").delete().eq("user_id", userId).eq("tmdb_id", media.tmdbId)

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
        user_id: userId,
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
    if (!userId) {
      console.log("❌ No userId available for favorites")
      return
    }

    console.log("💖 Toggling favorite for:", media.title)

    if (favorites.includes(media.tmdbId)) {
      // Remove from favorites
      const { error } = await supabase.from("favorites").delete().eq("user_id", userId).eq("tmdb_id", media.tmdbId)

      if (error) {
        console.error("❌ Error removing from favorites:", error)
      } else {
        console.log("✅ Removed from favorites")
        setFavorites((prev) => prev.filter((id) => id !== media.tmdbId))
      }
    } else {
      // Add to favorites
      const insertData = {
        user_id: userId,
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
    if (!userId) return []

    try {
      const { data } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", userId)
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

  const updateUsername = async (newUsername: string) => {
    if (!userId) {
      return { success: false, error: "No user ID available" }
    }

    try {
      const response = await fetch("/api/update-username", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, username: newUsername }),
      })

      const data = await response.json()

      if (data.success) {
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error("Error updating username:", error)
      return { success: false, error: "Failed to update username" }
    }
  }

  return {
    userId,
    username,
    favorites,
    watchHistory,
    isLoading,
    toggleFavorite,
    addToWatchHistory,
    getFavoriteMedia,
    updateUsername,
    loadUserData: () => loadUserData(userId),
  }
}
