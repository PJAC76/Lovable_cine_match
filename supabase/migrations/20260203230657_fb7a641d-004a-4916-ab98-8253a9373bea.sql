
-- Create unique index to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_media_items_unique_title_type_year 
ON media_items (title, type, year);
