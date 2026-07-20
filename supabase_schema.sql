-- Run this query inside your Supabase Dashboard SQL Editor to create the analytics database table.

CREATE TABLE IF NOT EXISTS analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'view' or 'click'
  link_id TEXT,
  country_code TEXT,
  country_name TEXT,
  device TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (so visitors on the public URL can submit views/clicks)
CREATE POLICY "Allow anonymous inserts" ON analytics
  FOR INSERT WITH CHECK (true);

-- Allow profile owners to read their own analytics logs
CREATE POLICY "Allow owners to read analytics" ON analytics
  FOR SELECT USING (profile_id = auth.uid());
