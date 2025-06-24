"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"

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

export function useDatabase() {
  const [userId, setUserId] = useState<string>("")
  const [favorites, setFavorites] = useState<number[]>([])
  const [watchHistory, setWatchHistory] = useState<Movie[]>([])
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
        console.log("Favorites data:", favoritesData)
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
        console.log("Watch history data:", historyData)

        const movies =
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
          })) || []

        setWatchHistory(movies)
      }
    } catch (error) {
      console.error("💥 Error loading user data:", error)
    }
  }

  const addToWatchHistory = async (movie: Movie) => {
    if (!userId) {
      console.log("❌ No userId available for watch history")
      return
    }

    console.log("🎬 Adding to watch history:", movie.title, "TMDB ID:", movie.tmdbId)

    try {
      // Remove existing entry if it exists
      const { error: deleteError } = await supabase
        .from("watch_history")
        .delete()
        .eq("user_id", userId)
        .eq("tmdb_id", movie.tmdbId)

      if (deleteError) {
        console.error("❌ Error deleting existing entry:", deleteError)
      } else {
        console.log("🗑️ Removed existing entry (if any)")
      }

      // Prepare the data to insert
      const insertData = {
        user_id: userId,
        tmdb_id: movie.tmdbId,
        imdb_id: movie.imdbId || null,
        movie_title: movie.title,
        movie_year: movie.year,
        movie_poster: movie.poster || null,
        movie_backdrop: movie.backdrop || null,
        movie_genre: movie.genre || null,
        movie_director: null, // This field might not exist in your schema
        movie_plot: movie.overview || null,
        movie_rating: movie.rating?.toString() || null,
        release_date: movie.releaseDate || null,
        runtime: movie.runtime || null,
        last_watched: new Date().toISOString(),
      }

      console.log("📝 Inserting data:", insertData)

      // Add new entry
      const { data, error } = await supabase.from("watch_history").insert(insertData).select()

      if (error) {
        console.error("❌ Error adding to watch history:", error)
        console.error("Error details:", error.details)
        console.error("Error hint:", error.hint)
        console.error("Error message:", error.message)
        return
      }

      console.log("✅ Successfully added to watch history:", data)

      // Update local state
      setWatchHistory((prev) => [movie, ...prev.filter((m) => m.tmdbId !== movie.tmdbId)].slice(0, 20))
      console.log("🔄 Updated local watch history state")
    } catch (error) {
      console.error("💥 Unexpected error adding to watch history:", error)
    }
  }

  const toggleFavorite = async (movie: Movie) => {
    if (!userId) {
      console.log("❌ No userId available for favorites")
      return
    }

    console.log("💖 Toggling favorite for:", movie.title)

    if (favorites.includes(movie.tmdbId)) {
      // Remove from favorites
      const { error } = await supabase.from("favorites").delete().eq("user_id", userId).eq("tmdb_id", movie.tmdbId)

      if (error) {
        console.error("❌ Error removing from favorites:", error)
      } else {
        console.log("✅ Removed from favorites")
        setFavorites((prev) => prev.filter((id) => id !== movie.tmdbId))
      }
    } else {
      // Add to favorites
      const insertData = {
        user_id: userId,
        tmdb_id: movie.tmdbId,
        imdb_id: movie.imdbId || null,
        movie_title: movie.title,
        movie_year: movie.year,
        movie_poster: movie.poster || null,
        movie_backdrop: movie.backdrop || null,
      }

      const { error } = await supabase.from("favorites").insert(insertData)

      if (error) {
        console.error("❌ Error adding to favorites:", error)
      } else {
        console.log("✅ Added to favorites")
        setFavorites((prev) => [...prev, movie.tmdbId])
      }
    }
  }

  const getFavoriteMovies = async (): Promise<Movie[]> => {
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
        })) || []
      )
    } catch (error) {
      console.error("Error getting favorite movies:", error)
      return []
    }
  }

  return {
    userId,
    favorites,
    watchHistory,
    isLoading,
    toggleFavorite,
    addToWatchHistory,
    getFavoriteMovies,
    loadUserData: () => loadUserData(userId),
  }
}
