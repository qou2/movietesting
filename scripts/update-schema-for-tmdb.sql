-- Add TMDB ID columns to existing tables
ALTER TABLE favorites 
ADD COLUMN IF NOT EXISTS tmdb_id INTEGER,
ADD COLUMN IF NOT EXISTS movie_backdrop TEXT;

ALTER TABLE watch_history 
ADD COLUMN IF NOT EXISTS tmdb_id INTEGER,
ADD COLUMN IF NOT EXISTS movie_backdrop TEXT,
ADD COLUMN IF NOT EXISTS movie_rating TEXT,
ADD COLUMN IF NOT EXISTS release_date TEXT,
ADD COLUMN IF NOT EXISTS runtime INTEGER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_favorites_tmdb_id ON favorites(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_tmdb_id ON watch_history(tmdb_id);

-- Update existing data (if any) - you may need to run a data migration
-- This is just a placeholder - you'd need to map existing IMDB IDs to TMDB IDs
-- UPDATE favorites SET tmdb_id = ... WHERE imdb_id = ...;
-- UPDATE watch_history SET tmdb_id = ... WHERE imdb_id = ...;
