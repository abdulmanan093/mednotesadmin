-- ============================================================
-- Medical Notes Admin — Supabase Database Schema
-- Run this SQL in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- ─── 1. BLOCKS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blocks (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL,
  year       INT  NOT NULL CHECK (year BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 2. SUBJECTS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subjects (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL,
  block_id   UUID NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 3. CHAPTERS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chapters (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  block_id   UUID NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 4. NOTES (PDF files) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id    UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  subject_id    UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  block_id      UUID NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
  pdf_file_name TEXT NOT NULL,
  pdf_file_key  TEXT,          -- R2 object key
  file_size     TEXT,
  upload_date   DATE DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ─── 5. USERS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  phone         TEXT,
  university    TEXT,
  mbbs_year     INT CHECK (mbbs_year BETWEEN 1 AND 5),
  status        TEXT NOT NULL DEFAULT 'Enabled' CHECK (status IN ('Enabled', 'Disabled')),
  access_start  DATE,
  access_end    DATE,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ─── 6. USER ↔ BLOCK (many-to-many) ───────────────────────
CREATE TABLE IF NOT EXISTS user_blocks (
  user_id  UUID NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  block_id UUID NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, block_id)
);

-- ─── 7. DEVICE INFO (one per user) ────────────────────────
CREATE TABLE IF NOT EXISTS devices (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  model         TEXT NOT NULL,
  os            TEXT NOT NULL,
  platform      TEXT NOT NULL CHECK (platform IN ('iOS', 'Android')),
  registered_at DATE NOT NULL DEFAULT CURRENT_DATE,
  last_seen     DATE NOT NULL DEFAULT CURRENT_DATE
);

-- ─── 8. ACTIVITY LOG ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_log (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name    TEXT NOT NULL,
  action       TEXT NOT NULL,
  course_block TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ─── INDEXES ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_subjects_block   ON subjects(block_id);
CREATE INDEX IF NOT EXISTS idx_chapters_subject ON chapters(subject_id);
CREATE INDEX IF NOT EXISTS idx_chapters_block   ON chapters(block_id);
CREATE INDEX IF NOT EXISTS idx_notes_chapter    ON notes(chapter_id);
CREATE INDEX IF NOT EXISTS idx_notes_block      ON notes(block_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_user ON user_blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_user     ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_date ON activity_log(created_at DESC);


-- ============================================================
-- VIEWS for easier querying (joins block names, etc.)
-- ============================================================

-- Subjects with block name
CREATE OR REPLACE VIEW subjects_view AS
SELECT s.*, b.name AS block_name, b.year AS block_year
FROM subjects s
JOIN blocks b ON b.id = s.block_id;

-- Chapters with subject + block names
CREATE OR REPLACE VIEW chapters_view AS
SELECT c.*, s.name AS subject_name, b.name AS block_name, b.year AS block_year
FROM chapters c
JOIN subjects s ON s.id = c.subject_id
JOIN blocks b   ON b.id = c.block_id;

-- Notes with chapter + subject + block names
CREATE OR REPLACE VIEW notes_view AS
SELECT n.*, ch.name AS chapter_name, s.name AS subject_name, b.name AS block_name, b.year AS block_year
FROM notes n
JOIN chapters ch ON ch.id = n.chapter_id
JOIN subjects s  ON s.id  = n.subject_id
JOIN blocks b    ON b.id  = n.block_id;

-- Users with assigned blocks + device info
CREATE OR REPLACE VIEW users_view AS
SELECT
  u.*,
  COALESCE(
    (SELECT json_agg(json_build_object('id', b.id, 'name', b.name, 'year', b.year))
     FROM user_blocks ub JOIN blocks b ON b.id = ub.block_id
     WHERE ub.user_id = u.id),
    '[]'::json
  ) AS assigned_blocks,
  (SELECT json_build_object(
      'model', d.model, 'os', d.os, 'platform', d.platform,
      'registeredAt', d.registered_at, 'lastSeen', d.last_seen
    ) FROM devices d WHERE d.user_id = u.id
  ) AS device_info
FROM users u;

-- Dashboard stats
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
  (SELECT count(*) FROM users)                            AS total_users,
  (SELECT count(*) FROM users WHERE status = 'Enabled')   AS active_users,
  (SELECT count(*) FROM users WHERE status = 'Disabled')  AS disabled_users,
  (SELECT count(*) FROM blocks)                           AS total_blocks,
  (SELECT count(*) FROM subjects)                         AS total_subjects,
  (SELECT count(*) FROM chapters)                         AS total_chapters,
  (SELECT count(*) FROM notes)                            AS total_notes;
