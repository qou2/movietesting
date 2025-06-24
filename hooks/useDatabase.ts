import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

interface Movie {
  title: string
  year: string
  imdbId: string
  poster?: string
  genre?: string
  director?: string
  imdbRating?: string
  plot?: string
}

export function useDatabase() {
  const [userId, setUserId] = useState<string>('')
  const [favorites, setFavorites] = useState<string[]>([])
  const [watchHistory, setWatchHistory] = useState<Movie[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Initialize user
  useEffect(() => {
    const initUser = async () => {
      let storedUserId = localStorage.getItem('movie_app_user_id')
      
      if (!storedUserId) {
        storedUserId = uuidv4()
        localStorage.setItem('movie_app_user_id', storedUserId)
        
        // Create user profile
        await supabase
          .from('user_profiles')
          .insert({ id: storedUserId })
      } else {
        // Update last active
        await supabase
          .from('user_profiles')
          .upsert({ 
            id: storedUserId, 
            last_active: new Date().toISOString() 
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
      // Load favorites
      const { data: favoritesData } = await supabase
        .from('favorites')
        .select('imdb_id')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })

      if (favoritesData) {
        setFavorites(favoritesData.map(f => f.imdb_id))
      }

      // Load watch history
      const { data: historyData } = await supabase
        .from('watch_history')
        .select('*')
        .eq('user_id', uid)
        .order('last_watched', { ascending: false })
        .limit(20)

      if (historyData) {
        const movies = historyData.map(h => ({
          title: h.movie_title,
          year: h.movie_year,
          imdbId: h.imdb_id,
          poster: h.movie_poster || undefined,
          genre: h.movie_genre || undefined,
          director: h.movie_director || undefined,
          imdbRating: h.imdb_rating || undefined,
          plot: h.movie_plot || undefined,
        }))
        setWatchHistory(movies)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const addToFavorites = async (movie: Movie) => {
    if (!userId || favorites.includes(movie.imdbId)) return

    try {
      const { error } = await supabase
        .from('favorites')
        .insert({
          user_id: userId,
          imdb_id: movie.imdbId,
          movie_title: movie.title,
          movie_year: movie.year,
          movie_poster: movie.poster,
        })

      if (!error) {
        setFavorites(prev => [...prev, movie.imdbId])
      }
    } catch (error) {
      console.error('Error adding to favorites:', error)
    }
  }

  const removeFromFavorites = async (imdbId: string) => {
    if (!userId) return

    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('imdb_id', imdbId)

      if (!error) {
        setFavorites(prev => prev.filter(id => id !== imdbId))
      }
    } catch (error) {
      console.error('Error removing from favorites:', error)
    }
  }

  const toggleFavorite = async (movie: Movie) => {
    if (favorites.includes(movie.imdbId)) {
      await removeFromFavorites(movie.imdbId)
    } else {
      await addToFavorites(movie)
    }
  }

  const addToWatchHistory = async (movie: Movie) => {
    if (!userId) return

    try {
      // Remove existing entry if it exists
      await supabase
        .from('watch_history')
        .delete()
        .eq('user_id', userId)
        .eq('imdb_id', movie.imdbId)

      // Add new entry
      const { error } = await supabase
        .from('watch_history')
        .insert({
          user_id: userId,
          imdb_id: movie.imdbId,
          movie_title: movie.title,
          movie_year: movie.year,
          movie_poster: movie.poster,
          movie_genre: movie.genre,
          movie_director: movie.director,
          imdb_rating: movie.imdbRating,
          movie_plot: movie.plot,
          last_watched: new Date().toISOString(),
        })

      if (!error) {
        // Update local state
        setWatchHistory(prev => [
          movie,
          ...prev.filter(m => m.imdbId !== movie.imdbId)
        ].slice(0, 20))
      }
    } catch (error) {
      console.error('Error adding to watch history:', error)
    }
  }

  const getFavoriteMovies = async (): Promise<Movie[]> => {
    if (!userId) return []

    try {
      const { data } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      return data?.map(f => ({
        title: f.movie_title,
        year: f.movie_year,
        imdbId: f.imdb_id,
        poster: f.movie_poster || undefined,
      })) || []
    } catch (error) {
      console.error('Error getting favorite movies:', error)
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