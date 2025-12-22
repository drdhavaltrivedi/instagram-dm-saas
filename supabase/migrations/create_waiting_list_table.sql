-- Create waiting_list table for storing waiting list submissions
CREATE TABLE IF NOT EXISTS waiting_list (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT,
  instagram_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_at_least_one CHECK (email IS NOT NULL OR instagram_id IS NOT NULL),
  CONSTRAINT unique_email UNIQUE (email) WHERE email IS NOT NULL
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_waiting_list_email ON waiting_list(email) WHERE email IS NOT NULL;

-- Create index on instagram_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_waiting_list_instagram_id ON waiting_list(instagram_id) WHERE instagram_id IS NOT NULL;

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_waiting_list_created_at ON waiting_list(created_at DESC);

-- Enable Row Level Security (RLS) - allow public inserts but restrict reads
ALTER TABLE waiting_list ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert (for public waiting list signup)
CREATE POLICY "Allow public inserts" ON waiting_list
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Allow public select
CREATE POLICY "Allow public select" ON public.waiting_list
FOR SELECT TO public USING (true);

-- Policy: Restrict reads to authenticated users only (optional - adjust based on your needs)
-- If you want to allow public reads, change this to: WITH CHECK (true)
CREATE POLICY "Restrict reads to authenticated users" ON waiting_list
  FOR SELECT
  TO authenticated
  USING (true);

