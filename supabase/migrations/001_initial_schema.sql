-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create players table
CREATE TABLE players (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES auth.users ON DELETE CASCADE,
  name         TEXT NOT NULL,
  jersey_num   TEXT,
  is_guest     BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Create games table
CREATE TABLE games (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES auth.users ON DELETE CASCADE,
  mode         INT CHECK (mode BETWEEN 1 AND 5),
  started_at   TIMESTAMPTZ,
  ended_at     TIMESTAMPTZ
);

-- Create game_players table
CREATE TABLE game_players (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id      UUID REFERENCES games(id) ON DELETE CASCADE,
  player_id    UUID REFERENCES players(id),
  team         CHAR(1) CHECK (team IN ('A','B'))
);

-- Create event_type enum
CREATE TYPE event_type AS ENUM (
  'shot2_make','shot2_miss','shot3_make','shot3_miss',
  'rebound','assist','block','steal','turnover','foul','custom'
);

-- Create events table
CREATE TABLE events (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id      UUID REFERENCES games(id) ON DELETE CASCADE,
  ts           TIMESTAMPTZ DEFAULT NOW(),
  possession   INT,
  actor_id     UUID REFERENCES game_players(id),
  target_id    UUID REFERENCES game_players(id),
  type         event_type,
  meta         JSONB
);

-- Row Level Security (RLS)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policies for players table
CREATE POLICY "Users can view their own players" ON players
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own players" ON players
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own players" ON players
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own players" ON players
  FOR DELETE USING (user_id = auth.uid());

-- Policies for games table
CREATE POLICY "Users can view their own games" ON games
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own games" ON games
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own games" ON games
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own games" ON games
  FOR DELETE USING (user_id = auth.uid());

-- Policies for game_players table
CREATE POLICY "Users can view game players for their games" ON game_players
  FOR SELECT USING (
    game_id IN (SELECT id FROM games WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert game players for their games" ON game_players
  FOR INSERT WITH CHECK (
    game_id IN (SELECT id FROM games WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update game players for their games" ON game_players
  FOR UPDATE USING (
    game_id IN (SELECT id FROM games WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete game players for their games" ON game_players
  FOR DELETE USING (
    game_id IN (SELECT id FROM games WHERE user_id = auth.uid())
  );

-- Policies for events table
CREATE POLICY "Users can view events for their games" ON events
  FOR SELECT USING (
    game_id IN (SELECT id FROM games WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert events for their games" ON events
  FOR INSERT WITH CHECK (
    game_id IN (SELECT id FROM games WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update events for their games" ON events
  FOR UPDATE USING (
    game_id IN (SELECT id FROM games WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete events for their games" ON events
  FOR DELETE USING (
    game_id IN (SELECT id FROM games WHERE user_id = auth.uid())
  );

-- Indexes for better performance
CREATE INDEX idx_players_user_id ON players(user_id);
CREATE INDEX idx_games_user_id ON games(user_id);
CREATE INDEX idx_game_players_game_id ON game_players(game_id);
CREATE INDEX idx_events_game_id ON events(game_id);
CREATE INDEX idx_events_actor_id ON events(actor_id);
CREATE INDEX idx_events_target_id ON events(target_id);