-- ============================================================
-- Add ordering for Subjects and Chapters
-- Run this in Supabase SQL Editor once.
-- ============================================================

-- Subjects: order within each block
ALTER TABLE subjects
  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

-- Chapters: order within each subject
ALTER TABLE chapters
  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

-- Helpful indexes for ordering queries
CREATE INDEX IF NOT EXISTS idx_subjects_block_sort
  ON subjects(block_id, sort_order, name);

CREATE INDEX IF NOT EXISTS idx_chapters_subject_sort
  ON chapters(subject_id, sort_order, name);

-- IMPORTANT:
-- Postgres expands `table.*` at VIEW creation time.
-- If `subjects_view` / `chapters_view` were created before `sort_order` existed,
-- they will NOT automatically include the new column.
-- Recreate the views so they expose `sort_order`.
-- NOTE: `CREATE OR REPLACE VIEW` cannot change existing view column names/order,
-- and will fail with error 42P16 after adding new columns to the underlying table.
-- Dropping and recreating is the simplest/most reliable approach.

DROP VIEW IF EXISTS public.chapters_view;
DROP VIEW IF EXISTS public.subjects_view;

CREATE VIEW public.subjects_view AS
SELECT s.*, b.name AS block_name, b.year AS block_year
FROM public.subjects s
JOIN public.blocks b ON b.id = s.block_id;

CREATE VIEW public.chapters_view AS
SELECT c.*, s.name AS subject_name, b.name AS block_name, b.year AS block_year
FROM public.chapters c
JOIN public.subjects s ON s.id = c.subject_id
JOIN public.blocks b   ON b.id = c.block_id;
