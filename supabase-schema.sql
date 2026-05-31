-- ============================================================
-- ATBU Hostel Connect — Supabase Schema
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Users (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  email         TEXT,
  reg_number    TEXT UNIQUE NOT NULL,
  role          TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'hostel_rep', 'admin')),
  campus        TEXT CHECK (campus IN ('gubi', 'yelwa')),
  hostel        TEXT,
  room_number   TEXT,
  room_updated_at TIMESTAMPTZ,
  avatar_url    TEXT,
  onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Channels
CREATE TABLE IF NOT EXISTS channels (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT,
  type          TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('general', 'hostel_rep', 'admin', 'hostel_specific')),
  campus        TEXT NOT NULL DEFAULT 'all',
  hostel        TEXT,
  member_count  INTEGER NOT NULL DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  channel_id      TEXT NOT NULL REFERENCES channels(id),
  sender_id       TEXT NOT NULL,
  sender_name     TEXT NOT NULL,
  sender_role     TEXT NOT NULL DEFAULT 'student',
  sender_avatar_url TEXT,
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Maintenance Tickets
CREATE TABLE IF NOT EXISTS maintenance_tickets (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title           TEXT NOT NULL,
  description     TEXT,
  category        TEXT NOT NULL CHECK (category IN ('plumbing','electrical','furniture','cleaning','security','other')),
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  priority        TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  hostel          TEXT NOT NULL,
  campus          TEXT NOT NULL CHECK (campus IN ('gubi','yelwa')),
  room_number     TEXT,
  reported_by     TEXT NOT NULL,
  reported_by_name TEXT NOT NULL,
  assigned_to     TEXT,
  notes           TEXT,
  image_url       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Listings
CREATE TABLE IF NOT EXISTS listings (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title           TEXT NOT NULL,
  description     TEXT,
  price           NUMERIC(10,2) NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('sell','buy','trade')),
  category        TEXT NOT NULL CHECK (category IN ('electronics','books','clothing','food','furniture','services','other')),
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','sold','withdrawn')),
  seller_id       TEXT NOT NULL,
  seller_name     TEXT NOT NULL,
  seller_hostel   TEXT NOT NULL,
  campus          TEXT NOT NULL CHECK (campus IN ('gubi','yelwa')),
  image_url       TEXT,
  negotiable      BOOLEAN NOT NULL DEFAULT FALSE,
  contact_info    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SOS Alerts
CREATE TABLE IF NOT EXISTS sos_alerts (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id         TEXT NOT NULL,
  user_name       TEXT NOT NULL,
  hostel          TEXT NOT NULL,
  campus          TEXT NOT NULL CHECK (campus IN ('gubi','yelwa')),
  room_number     TEXT,
  message         TEXT,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','resolved')),
  resolved_at     TIMESTAMPTZ,
  resolved_by     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications (SOS broadcast + future alerts)
CREATE TABLE IF NOT EXISTS notifications (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type            TEXT NOT NULL DEFAULT 'sos_alert',
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  from_hostel     TEXT NOT NULL,
  from_campus     TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users
CREATE POLICY "users_select" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "users_insert" ON users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update" ON users FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Channels (read-only for non-admins, service role manages writes)
CREATE POLICY "channels_select" ON channels FOR SELECT TO authenticated USING (true);

-- Messages
CREATE POLICY "messages_select" ON messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "messages_insert" ON messages FOR INSERT TO authenticated WITH CHECK (true);

-- Maintenance tickets
CREATE POLICY "tickets_select" ON maintenance_tickets FOR SELECT TO authenticated USING (true);
CREATE POLICY "tickets_insert" ON maintenance_tickets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "tickets_update" ON maintenance_tickets FOR UPDATE TO authenticated USING (true);

-- Listings
CREATE POLICY "listings_select" ON listings FOR SELECT TO authenticated USING (true);
CREATE POLICY "listings_insert" ON listings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "listings_update" ON listings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "listings_delete" ON listings FOR DELETE TO authenticated USING (true);

-- SOS alerts
CREATE POLICY "sos_select" ON sos_alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "sos_insert" ON sos_alerts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "sos_update" ON sos_alerts FOR UPDATE TO authenticated USING (true);

-- Notifications (read by all authenticated; backend service role writes)
CREATE POLICY "notifications_select" ON notifications FOR SELECT TO authenticated USING (true);

-- ── Realtime ──────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE sos_alerts;

-- ── Seed channels ─────────────────────────────────────────────────────────────
INSERT INTO channels (id, name, description, type, campus, hostel, member_count) VALUES
  ('ch-1',  'General — All Students',       'University-wide announcements and discussion',     'general',        'all',  NULL,             847),
  ('ch-2',  'Gubi Campus General',          'General chat for all Gubi campus residents',       'general',        'gubi', NULL,             412),
  ('ch-3',  'Yelwa Campus General',         'General chat for all Yelwa campus residents',      'general',        'yelwa',NULL,             435),
  ('ch-4',  'Block C (Gubi Male)',          'Block C hostel residents chat',                    'hostel_specific','gubi', 'Block C',        86),
  ('ch-5',  'CBN Hall (Gubi Male)',         'CBN Hall residents chat',                          'hostel_specific','gubi', 'CBN Hall',       72),
  ('ch-6',  'Old Block A (Gubi Female)',    'Old Block A residents chat',                       'hostel_specific','gubi', 'Old Block A',    94),
  ('ch-7',  'Block A (Yelwa Male)',         'Block A hostel residents chat',                    'hostel_specific','yelwa','Block A',        110),
  ('ch-8',  'Babylon (Yelwa Female)',       'Babylon hostel residents chat',                    'hostel_specific','yelwa','Babylon',        88),
  ('ch-9',  'Hostel Reps Council',         'Official channel for hostel representatives',       'hostel_rep',     'all',  NULL,             24),
  ('ch-10', 'Admin Notices',               'Official administrative announcements',             'admin',          'all',  NULL,             12)
ON CONFLICT (id) DO NOTHING;
