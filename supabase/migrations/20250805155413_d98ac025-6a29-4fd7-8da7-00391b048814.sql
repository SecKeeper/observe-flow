-- Add missing columns to alerts table
ALTER TABLE public.alerts 
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS priority text,
ADD COLUMN IF NOT EXISTS due_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS source text,
ADD COLUMN IF NOT EXISTS confidence_score numeric;