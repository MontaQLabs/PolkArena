-- Social Quest Feature Database Schema

-- Social quests table
CREATE TABLE IF NOT EXISTS social_quests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  context TEXT NOT NULL,
  hashtags TEXT,
  social_platforms TEXT[] NOT NULL, -- ['twitter', 'instagram', 'linkedin', 'facebook']
  ai_prompt TEXT,
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organizer_name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social quest participants table
CREATE TABLE IF NOT EXISTS social_quest_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quest_id UUID NOT NULL REFERENCES social_quests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(255) NOT NULL,
  shared_on TEXT[], -- ['twitter', 'instagram', etc.]
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(quest_id, user_id)
);

-- Social quest shares table (for tracking individual shares)
CREATE TABLE IF NOT EXISTS social_quest_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quest_id UUID NOT NULL REFERENCES social_quests(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES social_quest_participants(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL, -- 'twitter', 'instagram', 'linkedin', 'facebook'
  share_url TEXT,
  message_text TEXT,
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_social_quests_organizer_id ON social_quests(organizer_id);
CREATE INDEX IF NOT EXISTS idx_social_quests_is_active ON social_quests(is_active);
CREATE INDEX IF NOT EXISTS idx_social_quest_participants_quest_id ON social_quest_participants(quest_id);
CREATE INDEX IF NOT EXISTS idx_social_quest_shares_quest_id ON social_quest_shares(quest_id);

