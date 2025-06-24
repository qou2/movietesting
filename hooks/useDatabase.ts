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
      let storedUserId = localStorage.getItem("movie_app_user_id")

      if (!storedUserId) {
        storedUserId = uuidv4()
        localStorage.setItem("movie_app_user_id", storedUserId)

        // Create user profile
        await supabase.from("user_profiles").insert({ id: storedUserId })
      } else {
        // Update last active
        await supabase.from("user_profiles").upsert({
          id: storedUserId,
          last_active: new Date().toISOString(),
        })
      }

      setUserId(storedUserId)
      await loadUserData(storedUserId)
      setIsLoading(false)
    }

    initUser()
  }, [])

  const loadUserData = async (uid: string) => {
    try {
      // Load favorites - now using tmdb_id
      const { data: favoritesData } = await supabase
        .from("favorites")
        .select("tmdb_id")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })

      if (favoritesData) {
        setFavorites(favoritesData.map((f) => f.tmdb_id))
      }

      // Load watch history - now using tmdb_id
      const { data: historyData } = await supabase
        .from("watch_history")
        .select("*")
        .eq("user_id", uid)
        .order("last_watched", { ascending: false })
        .limit(20)

      if (historyData) {
        const movies = historyData.map((h) => ({
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
        }))
        setWatchHistory(movies)
      }
    } catch (error) {
      console.error("Error loading user data:", error)
    }
  }

  const addToFavorites = async (movie: Movie) => {
    if (!userId || favorites.includes(movie.tmdbId)) return

    try {
      const { error } = await supabase.from("favorites").insert({
        user_id: userId,
        tmdb_id: movie.tmdbId,
        imdb_id: movie.imdbId,
        movie_title: movie.title,
        movie_year: movie.year,
        movie_poster: movie.poster,
      })

      if (!error) {
        setFavorites((prev) => [...prev, movie.tmdbId])
      }
    } catch (error) {
      console.error("Error adding to favorites:", error)
    }
  }

  const removeFromFavorites = async (tmdbId: number) => {
    if (!userId) return

    try {
      const { error } = await supabase.from("favorites").delete().eq("user_id", userId).eq("tmdb_id", tmdbId)

      if (!error) {
        setFavorites((prev) => prev.filter((id) => id !== tmdbId))
      }
    } catch (error) {
      console.error("Error removing from favorites:", error)
    }
  }

  const toggleFavorite = async (movie: Movie) => {
    if (favorites.includes(movie.tmdbId)) {
      await removeFromFavorites(movie.tmdbId)
    } else {
      await addToFavorites(movie)
    }
  }

  const addToWatchHistory = async (movie: Movie) => {
    if (!userId) return

    try {
      // Remove existing entry if it exists
      await supabase.from("watch_history").delete().eq("user_id", userId).eq("tmdb_id", movie.tmdbId)

      // Add new entry
      const { error } = await supabase.from("watch_history").insert({
        user_id: userId,
        tmdb_id: movie.tmdbId,
        imdb_id: movie.imdbId,
        movie_title: movie.title,
        movie_year: movie.year,
        movie_poster: movie.poster,
        movie_backdrop: movie.backdrop,
        movie_genre: movie.genre,
        movie_plot: movie.overview,
        movie_rating: movie.rating?.toString(),
        release_date: movie.releaseDate,
        runtime: movie.runtime,
        last_watched: new Date().toISOString(),
      })

      if (!error) {
        // Update local state
        setWatchHistory((prev) => [movie, ...prev.filter((m) => m.tmdbId !== movie.tmdbId)].slice(0, 20))
      }
    } catch (error) {
      console.error("Error adding to watch history:", error)
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
