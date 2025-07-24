import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'demo-key';

// Create a mock client for development if no real credentials
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types
export interface Player {
  id: string;
  user_id: string;
  name: string;
  jersey_num?: string;
  is_guest: boolean;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  name?: string;
  location?: string;
  started_at: string;
  ended_at?: string;
  created_at: string;
}

export interface Game {
  id: string;
  session_id: string;
  user_id: string;
  mode: 1 | 2 | 3 | 4 | 5;
  game_number: number;
  started_at?: string;
  ended_at?: string;
}

export interface GamePlayer {
  id: string;
  game_id: string;
  player_id: string;
  team: 'A' | 'B';
}

export type EventType = 
  | 'shot2_make' | 'shot2_miss' | 'shot3_make' | 'shot3_miss'
  | 'rebound' | 'assist' | 'block' | 'steal' | 'turnover' | 'foul' | 'custom';

export interface GameEvent {
  id: string;
  game_id: string;
  ts: string;
  possession: number;
  actor_id: string;
  target_id?: string;
  type: EventType;
  meta?: any;
}