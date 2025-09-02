-- Bounties Feature Database Schema

-- Bounties table
CREATE TABLE IF NOT EXISTS bounties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  reward_amount NUMERIC(12,2) NOT NULL,
  reward_currency VARCHAR(16) DEFAULT 'USD',
  repo_url TEXT,
  issue_url TEXT,
  attachment_url TEXT,
  poster_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  poster_name VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_review','awarded','closed')),
  deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Applications (people applying to work on a bounty)
CREATE TABLE IF NOT EXISTS bounty_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bounty_id UUID NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  applicant_name VARCHAR(255) NOT NULL,
  pitch TEXT NOT NULL,
  portfolio_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(bounty_id, applicant_id)
);

-- Contributions (optional: PRs, commits, references)
CREATE TABLE IF NOT EXISTS bounty_contributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bounty_id UUID NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
  contributor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description TEXT,
  pr_url TEXT,
  commit_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Awards (selected winners)
CREATE TABLE IF NOT EXISTS bounty_awards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bounty_id UUID NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_name VARCHAR(255) NOT NULL,
  award_amount NUMERIC(12,2) NOT NULL,
  award_currency VARCHAR(16) DEFAULT 'USD',
  note TEXT,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_bounties_poster_id ON bounties(poster_id);
CREATE INDEX IF NOT EXISTS idx_bounties_status ON bounties(status);
CREATE INDEX IF NOT EXISTS idx_bounty_applications_bounty_id ON bounty_applications(bounty_id);
CREATE INDEX IF NOT EXISTS idx_bounty_contributions_bounty_id ON bounty_contributions(bounty_id);
CREATE INDEX IF NOT EXISTS idx_bounty_awards_bounty_id ON bounty_awards(bounty_id);
