-- Enable Row Level Security (RLS) and UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    wallet_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
-- Hackathons table
CREATE TABLE public.hackathons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    cover_image TEXT,
    tags TEXT [] DEFAULT '{}',
    host_id UUID REFERENCES public.users(id) NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
-- Teams table
CREATE TABLE public.teams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    hackathon_id UUID REFERENCES public.hackathons(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(hackathon_id, slug)
);
-- Team members table
CREATE TABLE public.team_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT CHECK (role IN ('leader', 'member')) DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(team_id, user_id)
);
-- Submissions table
CREATE TABLE public.submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL UNIQUE,
    github_link TEXT,
    demo_link TEXT,
    tech_stack TEXT [] DEFAULT '{}',
    description TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
-- Judges table
CREATE TABLE public.judges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    hackathon_id UUID REFERENCES public.hackathons(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(hackathon_id, user_id)
);
-- Scores table
CREATE TABLE public.scores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    judge_id UUID REFERENCES public.judges(id) ON DELETE CASCADE NOT NULL,
    score INTEGER CHECK (
        score >= 1
        AND score <= 10
    ) NOT NULL,
    comment TEXT,
    scored_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(team_id, judge_id)
);
-- Winners table
CREATE TABLE public.winners (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    hackathon_id UUID REFERENCES public.hackathons(id) ON DELETE CASCADE NOT NULL,
    rank INTEGER NOT NULL,
    prize_text TEXT,
    announced_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(hackathon_id, rank)
);
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = TIMEZONE('utc'::text, NOW());
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Create triggers for updated_at
CREATE TRIGGER handle_users_updated_at BEFORE
UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_hackathons_updated_at BEFORE
UPDATE ON public.hackathons FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_teams_updated_at BEFORE
UPDATE ON public.teams FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_submissions_updated_at BEFORE
UPDATE ON public.submissions FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
-- Row Level Security Policies
-- Users table policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON public.users FOR
SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR
UPDATE USING (auth.uid() = id);
-- Hackathons table policies
ALTER TABLE public.hackathons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view hackathons" ON public.hackathons FOR
SELECT USING (true);
CREATE POLICY "Authenticated users can create hackathons" ON public.hackathons FOR
INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Hosts can update own hackathons" ON public.hackathons FOR
UPDATE USING (auth.uid() = host_id);
-- Teams table policies
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view teams" ON public.teams FOR
SELECT USING (true);
CREATE POLICY "Authenticated users can create teams" ON public.teams FOR
INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Team members can update teams" ON public.teams FOR
UPDATE USING (
        id IN (
            SELECT team_id
            FROM public.team_members
            WHERE user_id = auth.uid()
        )
    );
-- Team members table policies
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view team members" ON public.team_members FOR
SELECT USING (true);
CREATE POLICY "Users can join teams" ON public.team_members FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team members can leave teams" ON public.team_members FOR DELETE USING (auth.uid() = user_id);
-- Submissions table policies
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view submissions" ON public.submissions FOR
SELECT USING (true);
CREATE POLICY "Team members can manage submissions" ON public.submissions FOR ALL USING (
    team_id IN (
        SELECT team_id
        FROM public.team_members
        WHERE user_id = auth.uid()
    )
);
-- Judges table policies
ALTER TABLE public.judges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view judges" ON public.judges FOR
SELECT USING (true);
-- Scores table policies
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view scores" ON public.scores FOR
SELECT USING (true);
CREATE POLICY "Judges can manage their scores" ON public.scores FOR ALL USING (
    judge_id IN (
        SELECT id
        FROM public.judges
        WHERE user_id = auth.uid()
    )
);
-- Winners table policies
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view winners" ON public.winners FOR
SELECT USING (true);
-- Create indexes for better performance
CREATE INDEX idx_hackathons_host_id ON public.hackathons(host_id);
CREATE INDEX idx_hackathons_start_date ON public.hackathons(start_date);
CREATE INDEX idx_hackathons_slug ON public.hackathons(slug);
CREATE INDEX idx_teams_hackathon_id ON public.teams(hackathon_id);
CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_submissions_team_id ON public.submissions(team_id);
CREATE INDEX idx_judges_hackathon_id ON public.judges(hackathon_id);
CREATE INDEX idx_scores_team_id ON public.scores(team_id);
CREATE INDEX idx_scores_judge_id ON public.scores(judge_id);
CREATE INDEX idx_winners_hackathon_id ON public.winners(hackathon_id);

CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  organizer_id UUID NOT NULL REFERENCES auth.users(id),
  organizer_name TEXT NOT NULL,
  banner_image_url TEXT,
  location TEXT,
  is_online BOOLEAN DEFAULT false,
  participant_limit INTEGER,
  tags TEXT[],
  custom_fields JSONB,
  registration_deadline TIMESTAMPTZ,
  website_url TEXT,
  discord_url TEXT,
  twitter_url TEXT,
  requirements TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for better query performance
CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_tags ON events USING GIN(tags);
