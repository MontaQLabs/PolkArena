-- Migration to add short_code field to events table
-- Run this in Supabase SQL Editor

-- Add the short_code column (allowing NULL temporarily)
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS short_code TEXT;

-- Create a function to generate short codes
CREATE OR REPLACE FUNCTION generate_event_short_code(event_name TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    result TEXT := '';
    characters TEXT := '23456789abcdefghjkmnpqrstuvwxyz';
    prefix TEXT := '';
    i INTEGER;
    generated_code TEXT;
    code_exists BOOLEAN;
    attempts INTEGER := 0;
BEGIN
    -- Generate prefix from event name if provided
    IF event_name IS NOT NULL THEN
        prefix := regexp_replace(lower(event_name), '[^a-z0-9]', '', 'g');
        prefix := substr(prefix, 1, 3);
        IF length(prefix) >= 2 THEN
            result := prefix;
        END IF;
    END IF;
    
    -- Fill to target length
    WHILE length(result) < 7 LOOP
        result := result || substr(characters, floor(random() * length(characters) + 1)::integer, 1);
    END LOOP;
    
    -- Check if code exists and regenerate if needed
    LOOP
        generated_code := result;
        SELECT EXISTS(SELECT 1 FROM public.events WHERE short_code = generated_code) INTO code_exists;
        
        IF NOT code_exists OR attempts > 10 THEN
            EXIT;
        END IF;
        
        -- Regenerate if exists
        result := '';
        IF length(prefix) >= 2 THEN
            result := prefix;
        END IF;
        
        WHILE length(result) < 7 LOOP
            result := result || substr(characters, floor(random() * length(characters) + 1)::integer, 1);
        END LOOP;
        
        attempts := attempts + 1;
    END LOOP;
    
    RETURN generated_code;
END;
$$ LANGUAGE plpgsql;

-- Generate short codes for existing events
UPDATE public.events 
SET short_code = generate_event_short_code(name)
WHERE short_code IS NULL;

-- Now make the column NOT NULL and UNIQUE
ALTER TABLE public.events 
ALTER COLUMN short_code SET NOT NULL;

ALTER TABLE public.events 
ADD CONSTRAINT events_short_code_unique UNIQUE (short_code);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_events_short_code ON public.events(short_code);

-- Drop the helper function
DROP FUNCTION generate_event_short_code(TEXT); 