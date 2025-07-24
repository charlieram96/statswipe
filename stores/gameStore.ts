import { create } from 'zustand';
import { Player, GamePlayer, GameEvent, EventType } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface GameState {
  // Game setup
  mode: 1 | 2 | 3 | 4 | 5 | null;
  teamA: GamePlayer[];
  teamB: GamePlayer[];
  selectedPlayer: GamePlayer | null;
  
  // Game state
  gameId: string | null;
  sessionId: string | null;
  gameNumber: number;
  isRunning: boolean;
  startTime: Date | null;
  possession: number;
  
  // Events
  events: GameEvent[];
  pendingEvents: GameEvent[]; // Offline queue
  
  // Actions
  setMode: (mode: 1 | 2 | 3 | 4 | 5) => void;
  setTeams: (teamA: GamePlayer[], teamB: GamePlayer[]) => void;
  selectPlayer: (player: GamePlayer | null) => void;
  startGame: (gameId: string, sessionId: string, gameNumber: number) => void;
  endGame: () => void;
  toggleClock: () => void;
  incrementPossession: () => void;
  
  // Event management
  addEvent: (event: Omit<GameEvent, 'id' | 'ts'>) => Promise<void>;
  undoLastEvent: () => Promise<void>;
  syncPendingEvents: () => Promise<void>;
  
  // Reset
  resetGame: () => void;
}

const PENDING_EVENTS_KEY = 'statswipe_pending_events';

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  mode: null,
  teamA: [],
  teamB: [],
  selectedPlayer: null,
  gameId: null,
  sessionId: null,
  gameNumber: 1,
  isRunning: false,
  startTime: null,
  possession: 1,
  events: [],
  pendingEvents: [],

  // Actions
  setMode: (mode) => set({ mode }),
  
  setTeams: (teamA, teamB) => set({ teamA, teamB }),
  
  selectPlayer: (player) => set({ selectedPlayer: player }),
  
  startGame: (gameId, sessionId, gameNumber) => set({ 
    gameId,
    sessionId,
    gameNumber,
    isRunning: false, 
    startTime: new Date(),
    possession: 1,
    events: [],
  }),
  
  endGame: () => set({ isRunning: false }),
  
  toggleClock: () => set((state) => ({ isRunning: !state.isRunning })),
  
  incrementPossession: () => set((state) => ({ possession: state.possession + 1 })),
  
  addEvent: async (eventData) => {
    const newEvent: GameEvent = {
      ...eventData,
      id: `temp_${Date.now()}_${Math.random()}`,
      ts: new Date().toISOString(),
    };
    
    set((state) => ({
      events: [...state.events, newEvent],
      pendingEvents: [...state.pendingEvents, newEvent],
    }));
    
    // Save to AsyncStorage for offline persistence
    try {
      const pendingEvents = [...get().pendingEvents];
      await AsyncStorage.setItem(PENDING_EVENTS_KEY, JSON.stringify(pendingEvents));
    } catch (error) {
      console.error('Failed to save pending events:', error);
    }
    
    // If it's a made shot, we might need to prompt for assist
    if (eventData.type === 'shot2_make' || eventData.type === 'shot3_make') {
      // This will be handled by the UI component
    }
  },
  
  undoLastEvent: async () => {
    const { events, pendingEvents } = get();
    
    if (events.length === 0) return;
    
    const lastEvent = events[events.length - 1];
    
    set({
      events: events.slice(0, -1),
      pendingEvents: pendingEvents.filter(e => e.id !== lastEvent.id),
    });
    
    // Update AsyncStorage
    try {
      const newPendingEvents = pendingEvents.filter(e => e.id !== lastEvent.id);
      await AsyncStorage.setItem(PENDING_EVENTS_KEY, JSON.stringify(newPendingEvents));
    } catch (error) {
      console.error('Failed to update pending events:', error);
    }
  },
  
  syncPendingEvents: async () => {
    // This will be implemented in the sync service
    const pendingEvents = get().pendingEvents;
    if (pendingEvents.length === 0) return;
    
    // Clear pending events after successful sync
    set({ pendingEvents: [] });
    await AsyncStorage.removeItem(PENDING_EVENTS_KEY);
  },
  
  resetGame: () => set({
    mode: null,
    teamA: [],
    teamB: [],
    selectedPlayer: null,
    gameId: null,
    sessionId: null,
    gameNumber: 1,
    isRunning: false,
    startTime: null,
    possession: 1,
    events: [],
    pendingEvents: [],
  }),
}));

// Load pending events on app start
export const loadPendingEvents = async () => {
  try {
    const saved = await AsyncStorage.getItem(PENDING_EVENTS_KEY);
    if (saved) {
      const pendingEvents = JSON.parse(saved);
      useGameStore.setState({ pendingEvents });
    }
  } catch (error) {
    console.error('Failed to load pending events:', error);
  }
};