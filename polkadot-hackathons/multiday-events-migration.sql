-- Migration: Add multi-day events support
-- Run this on existing databases to add multi-day functionality

-- Add is_multi_day column to events table
ALTER TABLE public.events ADD COLUMN is_multi_day BOOLEAN DEFAULT false;

-- Create event days table for multi-day non-continuous events
CREATE TABLE public.event_days (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  day_name TEXT, -- Optional name like "Day 1: Introduction", "Workshop Day", etc.
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, day_number)
);

-- Event days table policies
ALTER TABLE public.event_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view event days" ON public.event_days FOR
SELECT USING (true);
CREATE POLICY "Event organizers can manage event days" ON public.event_days FOR ALL USING (
    event_id IN (SELECT id FROM public.events WHERE organizer_id = auth.uid())
);

-- Add indexes for better performance
CREATE INDEX idx_event_days_event_id ON public.event_days(event_id);
CREATE INDEX idx_event_days_start_time ON public.event_days(start_time); 