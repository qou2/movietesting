import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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
          imdb_id: string
          movie_title: string
          movie_year: string
          movie_poster: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          imdb_id: string
          movie_title: string
          movie_year: string
          movie_poster?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          imdb_id?: string
          movie_title?: string
          movie_year?: string
          movie_poster?: string | null
          created_at?: string
        }
      }
      watch_history: {
        Row: {
          id: string
          user_id: string
          imdb_id: string
          movie_title: string
          movie_year: string
          movie_poster: string | null
          movie_genre: string | null
          movie_director: string | null
          imdb_rating: string | null
          movie_plot: string | null
          last_watched: string
        }
        Insert: {
          id?: string
          user_id: string
          imdb_id: string
          movie_title: string
          movie_year: string
          movie_poster?: string | null
          movie_genre?: string | null
          movie_director?: string | null
          imdb_rating?: string | null
          movie_plot?: string | null
          last_watched?: string
        }
        Update: {
          id?: string
          user_id?: string
          imdb_id?: string
          movie_title?: string
          movie_year?: string
          movie_poster?: string | null
          movie_genre?: string | null
          movie_director?: string | null
          imdb_rating?: string | null
          movie_plot?: string | null
          last_watched?: string
        }
      }
    }
  }
}