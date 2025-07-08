-- Storage setup for event banner images
-- Run this in Supabase SQL Editor

-- Create the event-banners storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-banners', 'event-banners', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the storage.objects table (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload event banner images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'event-banners' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to update their own files
CREATE POLICY "Users can update their own event banner images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'event-banners' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
) WITH CHECK (
  bucket_id = 'event-banners' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own event banner images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'event-banners' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow public read access to all event banner images
CREATE POLICY "Public read access for event banner images" ON storage.objects
FOR SELECT USING (bucket_id = 'event-banners');

-- Optional: Policy to allow event organizers to delete images from their events
-- This requires the file path to include the organizer's user ID
CREATE POLICY "Event organizers can manage event banner images" ON storage.objects
FOR ALL USING (
  bucket_id = 'event-banners' 
  AND auth.role() = 'authenticated'
  AND (
    -- User owns the file (file is in their folder)
    (storage.foldername(name))[1] = auth.uid()::text
    OR 
    -- User is the organizer of an event that uses this image
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE organizer_id = auth.uid() 
      AND banner_image_url = name
    )
  )
) WITH CHECK (
  bucket_id = 'event-banners' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
); 