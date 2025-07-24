-- Add username field to profiles table
ALTER TABLE profiles ADD COLUMN username TEXT UNIQUE;

-- Create index for username lookups
CREATE INDEX idx_profiles_username ON profiles(username);

-- Update the profile creation function to handle usernames
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, hooper_code, display_name, username)
  VALUES (
    NEW.id,
    generate_unique_hooper_code(),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.raw_user_meta_data->>'username'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique username from email (fallback)
CREATE OR REPLACE FUNCTION generate_unique_username(email_address TEXT)
RETURNS TEXT AS $$
DECLARE
  base_username TEXT;
  new_username TEXT;
  counter INTEGER := 1;
  username_exists BOOLEAN;
BEGIN
  -- Extract username part from email
  base_username := LOWER(split_part(email_address, '@', 1));
  
  -- Remove non-alphanumeric characters except underscores
  base_username := regexp_replace(base_username, '[^a-zA-Z0-9_]', '', 'g');
  
  -- Ensure minimum length
  IF LENGTH(base_username) < 3 THEN
    base_username := 'user' || base_username;
  END IF;
  
  -- Start with the base username
  new_username := base_username;
  
  LOOP
    -- Check if username already exists
    SELECT EXISTS(
      SELECT 1 FROM profiles WHERE username = new_username
    ) INTO username_exists;
    
    -- Exit loop if username is unique
    IF NOT username_exists THEN
      EXIT;
    END IF;
    
    -- Increment counter and try again
    counter := counter + 1;
    new_username := base_username || counter::TEXT;
  END LOOP;
  
  RETURN new_username;
END;
$$ LANGUAGE plpgsql;

-- Update existing profiles without usernames
UPDATE profiles 
SET username = generate_unique_username(
  (SELECT email FROM auth.users WHERE auth.users.id = profiles.id)
)
WHERE username IS NULL;