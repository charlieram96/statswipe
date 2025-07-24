-- Create profiles table to store user metadata including hooper codes
CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  hooper_code  TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  is_guest     BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Add hooper_code to players table for guest players
ALTER TABLE players ADD COLUMN hooper_code TEXT;

-- Create index for hooper code lookups
CREATE INDEX idx_profiles_hooper_code ON profiles(hooper_code);
CREATE INDEX idx_players_hooper_code ON players(hooper_code);

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles table
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Function to generate unique hooper code
CREATE OR REPLACE FUNCTION generate_unique_hooper_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 6 character code
    new_code := UPPER(
      substr(md5(random()::text), 1, 2) || 
      floor(random() * 90 + 10)::text || 
      substr(md5(random()::text), 1, 2)
    );
    
    -- Check if code already exists
    SELECT EXISTS(
      SELECT 1 FROM profiles WHERE hooper_code = new_code
      UNION
      SELECT 1 FROM players WHERE hooper_code = new_code AND is_guest = true
    ) INTO code_exists;
    
    -- Exit loop if code is unique
    IF NOT code_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, hooper_code, display_name)
  VALUES (
    NEW.id,
    generate_unique_hooper_code(),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update existing users to have profiles (if any exist)
INSERT INTO profiles (id, hooper_code, display_name)
SELECT 
  id,
  generate_unique_hooper_code(),
  COALESCE(raw_user_meta_data->>'full_name', email)
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles);