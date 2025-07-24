import { create } from 'zustand';
import { Session } from '../lib/supabase';

interface BasketballSessionStore {
  // Current session
  currentSession: Session | null;
  
  // Session management
  createSession: (name?: string, location?: string) => Session;
  endSession: () => void;
  setCurrentSession: (session: Session | null) => void;
  
  // Session state
  isInSession: boolean;
  sessionGames: string[]; // Array of game IDs in current session
  addGameToSession: (gameId: string) => void;
  
  // Session history (mock data for now)
  sessions: Session[];
  loadSessions: () => void;
}

// Mock sessions for development
const mockSessions: Session[] = [
  {
    id: 'session_1',
    user_id: 'user_1',
    name: 'Morning Run',
    location: 'Downtown Court',
    started_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    ended_at: new Date(Date.now() - 82800000).toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'session_2',
    user_id: 'user_1',
    name: 'Weekend Games',
    location: 'Community Center',
    started_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    ended_at: new Date(Date.now() - 165600000).toISOString(),
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 'session_3',
    user_id: 'user_1',
    name: 'Quick 1v1',
    started_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    ended_at: new Date(Date.now() - 255600000).toISOString(),
    created_at: new Date(Date.now() - 259200000).toISOString(),
  },
];

export const useBasketballSessionStore = create<BasketballSessionStore>((set, get) => ({
  currentSession: null,
  isInSession: false,
  sessionGames: [],
  sessions: [],
  
  createSession: (name?: string, location?: string) => {
    const session: Session = {
      id: `session_${Date.now()}`,
      user_id: 'current_user', // This will be replaced with actual user ID
      name: name || `Session ${new Date().toLocaleDateString()}`,
      location,
      started_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    
    set((state) => ({ 
      currentSession: session, 
      isInSession: true,
      sessionGames: [],
      sessions: [session, ...state.sessions]
    }));
    
    return session;
  },
  
  endSession: () => {
    const { currentSession, sessions } = get();
    if (currentSession) {
      // Update the session with ended_at timestamp
      const endedSession = {
        ...currentSession,
        ended_at: new Date().toISOString()
      };
      
      // Update the session in the sessions array
      const updatedSessions = sessions.map(s => 
        s.id === currentSession.id ? endedSession : s
      );
      
      set({ 
        currentSession: null, 
        isInSession: false,
        sessionGames: [],
        sessions: updatedSessions
      });
      
      // In a real app, this would save to the database
      console.log('Session ended:', endedSession);
    }
  },
  
  setCurrentSession: (session) => {
    set({ 
      currentSession: session,
      isInSession: !!session
    });
  },
  
  addGameToSession: (gameId) => {
    set((state) => ({
      sessionGames: [...state.sessionGames, gameId]
    }));
  },
  
  loadSessions: () => {
    // In a real app, this would load from the database
    set({ sessions: mockSessions });
  }
}));