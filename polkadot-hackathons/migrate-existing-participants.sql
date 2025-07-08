-- Migrate existing participant statuses to new approval workflow
-- Run this in Supabase SQL Editor after the schema update

-- First, let's see what statuses currently exist
SELECT status, COUNT(*) as count 
FROM public.event_participants 
GROUP BY status 
ORDER BY count DESC;

-- Update existing participants based on their current status
-- Convert 'going' and 'invited' to 'approved' (since they were already accepted)
UPDATE public.event_participants 
SET status = 'approved',
    approved_at = COALESCE(updated_at, registered_at),
    approved_by = (
      SELECT organizer_id 
      FROM public.events 
      WHERE events.id = event_participants.event_id
    )
WHERE status IN ('going', 'invited');

-- Convert 'maybe' to 'pending' (needs organizer decision)
UPDATE public.event_participants 
SET status = 'pending'
WHERE status = 'maybe';

-- Convert 'not_going' to 'rejected' 
UPDATE public.event_participants 
SET status = 'rejected',
    rejection_reason = 'User declined participation'
WHERE status = 'not_going';

-- Verify the migration
SELECT status, COUNT(*) as count 
FROM public.event_participants 
GROUP BY status 
ORDER BY count DESC; 