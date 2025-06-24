import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          created_at: string
          last_active: string
        }
        Insert: {
          id?: string
          created_at?: string
          last_active?: string
        }
        Update: {
          id?: string
          created_at?: string
          last_active?: string
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          tmdb_id: number
          imdb_id: string | null
          movie_title: string
          movie_year: string
          movie_poster: string | null
          movie_backdrop: string | null
          media_type: string
          season_number: number | null
          episode_number: number | null
          total_seasons: number | null
          total_episodes: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tmdb_id: number
          imdb_id?: string | null
          movie_title: string
          movie_year: string
          movie_poster?: string | null
          movie_backdrop?: string | null
          media_type?: string
          season_number?: number | null
          episode_number?: number | null
          total_seasons?: number | null
          total_episodes?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tmdb_id?: number
          imdb_id?: string | null
          movie_title?: string
          movie_year?: string
          movie_poster?: string | null
          movie_backdrop?: string | null
          media_type?: string
          season_number?: number | null
          episode_number?: number | null
          total_seasons?: number | null
          total_episodes?: number | null
          created_at?: string
        }
      }
      watch_history: {
        Row: {
          id: string
          user_id: string
          tmdb_id: number
          imdb_id: string | null
          movie_title: string
          movie_year: string
          movie_poster: string | null
          movie_backdrop: string | null
          movie_genre: string | null
          movie_plot: string | null
          movie_rating: string | null
          release_date: string | null
          runtime: number | null
          media_type: string
          season_number: number | null
          episode_number: number | null
          total_seasons: number | null
          total_episodes: number | null
          episode_title: string | null
          season_title: string | null
          last_watched: string
        }
        Insert: {
          id?: string
          user_id: string
          tmdb_id: number
          imdb_id?: string | null
          movie_title: string
          movie_year: string
          movie_poster?: string | null
          movie_backdrop?: string | null
          movie_genre?: string | null
          movie_plot?: string | null
          movie_rating?: string | null
          release_date?: string | null
          runtime?: number | null
          media_type?: string
          season_number?: number | null
          episode_number?: number | null
          total_seasons?: number | null
          total_episodes?: number | null
          episode_title?: string | null
          season_title?: string | null
          last_watched?: string
        }
        Update: {
          id?: string
          user_id?: string
          tmdb_id?: number
          imdb_id?: string | null
          movie_title?: string
          movie_year?: string
          movie_poster?: string | null
          movie_backdrop?: string | null
          movie_genre?: string | null
          movie_plot?: string | null
          movie_rating?: string | null
          release_date?: string | null
          runtime?: number | null
          media_type?: string
          season_number?: number | null
          episode_number?: number | null
          total_seasons?: number | null
          total_episodes?: number | null
          episode_title?: string | null
          season_title?: string | null
          last_watched?: string
        }
      }
    }
  }
}
