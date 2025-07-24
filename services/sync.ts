import { supabase, GameEvent } from '../lib/supabase';
import { useGameStore } from '../stores/gameStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const SYNC_KEY = 'statswipe_last_sync';
const RETRY_DELAY = 5000; // 5 seconds
const MAX_RETRIES = 3;

class SyncService {
  private isSyncing = false;
  private retryCount = 0;
  private unsubscribeNetInfo: (() => void) | null = null;

  async initialize() {
    // Listen for network changes
    this.unsubscribeNetInfo = NetInfo.addEventListener(state => {
      if (state.isConnected && !this.isSyncing) {
        this.syncPendingEvents();
      }
    });

    // Initial sync attempt
    const netState = await NetInfo.fetch();
    if (netState.isConnected) {
      await this.syncPendingEvents();
    }
  }

  async syncPendingEvents() {
    if (this.isSyncing) return;
    
    const pendingEvents = useGameStore.getState().pendingEvents;
    if (pendingEvents.length === 0) return;

    this.isSyncing = true;

    try {
      // Batch insert events
      const eventsToSync = pendingEvents.map(event => ({
        game_id: event.game_id,
        ts: event.ts,
        possession: event.possession,
        actor_id: event.actor_id,
        target_id: event.target_id,
        type: event.type,
        meta: event.meta,
      }));

      const { data, error } = await supabase
        .from('events')
        .insert(eventsToSync)
        .select();

      if (error) {
        throw error;
      }

      // Clear successfully synced events
      const syncedIds = pendingEvents.map(e => e.id);
      const remainingEvents = useGameStore.getState().pendingEvents.filter(
        e => !syncedIds.includes(e.id)
      );
      
      useGameStore.setState({ pendingEvents: remainingEvents });
      
      // Update AsyncStorage
      if (remainingEvents.length === 0) {
        await AsyncStorage.removeItem('statswipe_pending_events');
      } else {
        await AsyncStorage.setItem(
          'statswipe_pending_events',
          JSON.stringify(remainingEvents)
        );
      }

      // Update last sync time
      await AsyncStorage.setItem(SYNC_KEY, new Date().toISOString());
      
      this.retryCount = 0;
      console.log(`Successfully synced ${syncedIds.length} events`);
      
    } catch (error) {
      console.log('Sync failed:', error?.toString() || 'Unknown error');
      
      this.retryCount++;
      if (this.retryCount < MAX_RETRIES) {
        setTimeout(() => this.syncPendingEvents(), RETRY_DELAY);
      }
    } finally {
      this.isSyncing = false;
    }
  }

  async forceSyncGame(gameId: string) {
    // Force sync all events for a specific game
    const pendingEvents = useGameStore.getState().pendingEvents.filter(
      e => e.game_id === gameId
    );
    
    if (pendingEvents.length === 0) return;

    try {
      const { data, error } = await supabase
        .from('events')
        .insert(pendingEvents)
        .select();

      if (error) throw error;

      // Remove synced events from pending
      const syncedIds = pendingEvents.map(e => e.id);
      const remainingEvents = useGameStore.getState().pendingEvents.filter(
        e => !syncedIds.includes(e.id)
      );
      
      useGameStore.setState({ pendingEvents: remainingEvents });
      
      // Update AsyncStorage
      await AsyncStorage.setItem(
        'statswipe_pending_events',
        JSON.stringify(remainingEvents)
      );

      return { success: true, syncedCount: syncedIds.length };
    } catch (error) {
      console.log('Force sync failed:', error?.toString() || 'Unknown error');
      return { success: false, error: error?.toString() || 'Unknown error' };
    }
  }

  async getLastSyncTime(): Promise<Date | null> {
    try {
      const lastSync = await AsyncStorage.getItem(SYNC_KEY);
      return lastSync ? new Date(lastSync) : null;
    } catch {
      return null;
    }
  }

  cleanup() {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = null;
    }
  }
}

export const syncService = new SyncService();

// Auto-sync helper
export const setupAutoSync = async () => {
  await syncService.initialize();
  
  // Sync every 30 seconds if online
  setInterval(async () => {
    const netState = await NetInfo.fetch();
    if (netState.isConnected) {
      syncService.syncPendingEvents();
    }
  }, 30000);
};