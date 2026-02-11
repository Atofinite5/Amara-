-- Run this in your Supabase SQL Editor to fix the "missing column" error
ALTER TABLE events ADD COLUMN IF NOT EXISTS details TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS match_details TEXT;
