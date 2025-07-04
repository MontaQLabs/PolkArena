-- Add missing DELETE policy for hackathons table - Run this in Supabase SQL Editor

-- Add the DELETE policy using organizer_id (the field your app actually uses)
CREATE POLICY "Organizers can delete own hackathons" ON public.hackathons FOR
DELETE USING (auth.uid() = organizer_id); 