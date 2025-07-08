-- Update event participants table to support approval workflow
-- Run this in Supabase SQL Editor

-- Drop the existing constraint
ALTER TABLE public.event_participants 
DROP CONSTRAINT IF EXISTS event_participants_status_check;

-- Add new constraint with approval statuses
ALTER TABLE public.event_participants 
ADD CONSTRAINT event_participants_status_check 
CHECK (status = ANY (ARRAY[
  'pending'::text, 
  'approved'::text, 
  'rejected'::text,
  'going'::text, 
  'maybe'::text, 
  'not_going'::text, 
  'invited'::text
]));

-- Update default status to 'pending' for new registrations
ALTER TABLE public.event_participants 
ALTER COLUMN status SET DEFAULT 'pending'::text;

-- Add fields for approval workflow
ALTER TABLE public.event_participants 
ADD COLUMN IF NOT EXISTS registration_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_participants_status_pending ON public.event_participants(event_id, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_event_participants_approved ON public.event_participants(event_id, approved_at) WHERE status = 'approved';

-- Verify the changes
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'event_participants' 
AND table_schema = 'public'
ORDER BY ordinal_position; 