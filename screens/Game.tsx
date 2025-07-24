import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Animated,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { SwipeZone } from '../components/SwipeZone';
import { PlayerBox } from '../components/PlayerBox';
import { useGameStore } from '../stores/gameStore';
import { useBasketballSessionStore } from '../stores/basketballSessionStore';
import { EventType, GamePlayer, Player } from '../lib/supabase';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { FONTS } from '../constants/fonts';

interface PlayerWithStats extends Player {
  stats: {
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
  };
}

export const GameScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const {
    gameId,
    teamA,
    teamB,
    selectedPlayer,
    selectPlayer,
    isRunning,
    toggleClock,
    possession,
    incrementPossession,
    events,
    addEvent,
    undoLastEvent,
    endGame,
  } = useGameStore();

  const [elapsedTime, setElapsedTime] = useState(0);
  const [showAssistModal, setShowAssistModal] = useState(false);
  const [pendingShotEvent, setPendingShotEvent] = useState<any>(null);
  const [showShotTypeModal, setShowShotTypeModal] = useState(false);

  // Clock timer - 100ms intervals for tenth-second precision
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Format time display with tenths of seconds
  const formatTime = (tenths: number) => {
    const totalSeconds = Math.floor(tenths / 10);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const remainingTenths = tenths % 10;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${remainingTenths}`;
  };

  // Calculate player stats
  const calculatePlayerStats = (gamePlayer: GamePlayer) => {
    const stats = {
      points: 0,
      rebounds: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
    };

    events.forEach((event) => {
      if (event.actor_id === gamePlayer.id) {
        switch (event.type) {
          case 'shot2_make':
            stats.points += 2;
            break;
          case 'shot3_make':
            stats.points += 3;
            break;
          case 'rebound':
            stats.rebounds++;
            break;
          case 'assist':
            stats.assists++;
            break;
          case 'steal':
            stats.steals++;
            break;
          case 'block':
            stats.blocks++;
            break;
        }
      }
    });

    return stats;
  };

  // Calculate full stats including shooting percentages
  const calculateFullStats = (gamePlayer: GamePlayer) => {
    const fullStats = {
      points: 0,
      fieldGoalsMade: 0,
      fieldGoalsAttempted: 0,
      threePointersMade: 0,
      threePointersAttempted: 0,
      twoPointersMade: 0,
      twoPointersAttempted: 0,
      rebounds: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0,
      fouls: 0,
    };

    events.forEach((event) => {
      if (event.actor_id === gamePlayer.id) {
        switch (event.type) {
          case 'shot2_make':
            fullStats.points += 2;
            fullStats.twoPointersMade++;
            fullStats.twoPointersAttempted++;
            fullStats.fieldGoalsMade++;
            fullStats.fieldGoalsAttempted++;
            break;
          case 'shot2_miss':
            fullStats.twoPointersAttempted++;
            fullStats.fieldGoalsAttempted++;
            break;
          case 'shot3_make':
            fullStats.points += 3;
            fullStats.threePointersMade++;
            fullStats.threePointersAttempted++;
            fullStats.fieldGoalsMade++;
            fullStats.fieldGoalsAttempted++;
            break;
          case 'shot3_miss':
            fullStats.threePointersAttempted++;
            fullStats.fieldGoalsAttempted++;
            break;
          case 'rebound':
            fullStats.rebounds++;
            break;
          case 'assist':
            fullStats.assists++;
            break;
          case 'steal':
            fullStats.steals++;
            break;
          case 'block':
            fullStats.blocks++;
            break;
          case 'turnover':
            fullStats.turnovers++;
            break;
          case 'foul':
            fullStats.fouls++;
            break;
        }
      }
    });

    return fullStats;
  };

  const handleStatRecorded = useCallback(async (eventType: EventType | 'shot2_attempt' | 'shot3_attempt', playerId: string) => {
    try {
      if (!gameId) {
        console.log('No game ID');
        return;
      }

      console.log('Recording stat:', eventType, 'for player:', playerId);

      // Convert shot attempts to generic types for now
      let finalEventType: EventType;
      if (eventType === 'shot2_attempt' || eventType === 'shot3_attempt') {
        finalEventType = 'shot2_make' as EventType; // This will be updated when we add make/miss logic
      } else {
        finalEventType = eventType as EventType;
      }

      await addEvent({
        game_id: gameId,
        possession,
        actor_id: playerId,
        type: finalEventType,
      });

      // Auto-increment possession on certain events
      if (['turnover', 'steal'].includes(eventType)) {
        incrementPossession();
      }
    } catch (error) {
      console.error('Error recording stat:', error);
      Alert.alert('Error', 'Failed to record stat. Please try again.');
    }
  }, [gameId, possession, addEvent, incrementPossession]);

  const handleShotType = async (type: '2pt' | '3pt') => {
    setShowShotTypeModal(false);
    setPendingShotEvent({ type, playerId: selectedPlayer?.id });
    
    // Show swipe pad for make/miss
    Alert.alert(
      `${type} Shot`,
      'Swipe right for make, left for miss',
      [{ text: 'OK' }]
    );
  };

  const handleShotResult = async (made: boolean) => {
    if (!pendingShotEvent || !gameId) return;

    const eventType = pendingShotEvent.type === '2pt'
      ? (made ? 'shot2_make' : 'shot2_miss')
      : (made ? 'shot3_make' : 'shot3_miss');

    await addEvent({
      game_id: gameId,
      possession,
      actor_id: pendingShotEvent.playerId,
      type: eventType,
    });

    if (made) {
      // Show assist modal after 500ms
      setTimeout(() => setShowAssistModal(true), 500);
    }

    setPendingShotEvent(null);
  };

  const handleAssistSelect = async (assistPlayerId: string | null) => {
    setShowAssistModal(false);
    
    if (assistPlayerId && gameId) {
      await addEvent({
        game_id: gameId,
        possession,
        actor_id: assistPlayerId,
        type: 'assist',
        target_id: selectedPlayer?.id,
      });
    }
  };


  const handleEndGame = () => {
    Alert.alert(
      'End Game',
      'Are you sure you want to end this game?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Game',
          style: 'destructive',
          onPress: () => {
            endGame();
            // Ask if they want to play another game in the same session
            Alert.alert(
              'Continue Session?',
              'Would you like to play another game in this session?',
              [
                {
                  text: 'End Session',
                  style: 'destructive',
                  onPress: () => {
                    // End the session and go to history
                    const { endSession } = useBasketballSessionStore.getState();
                    endSession();
                    navigation.navigate('My Games' as never);
                  },
                },
                {
                  text: 'New Game',
                  onPress: () => {
                    // Keep session active and go to setup
                    navigation.navigate('NewGame' as never);
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  // Mock player data - matches the RosterSelect players
  const mockPlayers: { [key: string]: Player } = {
    '1': { id: '1', user_id: '1', name: 'John Smith', jersey_num: '23', is_guest: false, created_at: '' },
    '2': { id: '2', user_id: '1', name: 'Mike Johnson', jersey_num: '24', is_guest: false, created_at: '' },
    '3': { id: '3', user_id: '1', name: 'David Williams', jersey_num: '25', is_guest: false, created_at: '' },
    '4': { id: '4', user_id: '1', name: 'Chris Brown', jersey_num: '26', is_guest: false, created_at: '' },
    '5': { id: '5', user_id: '1', name: 'James Davis', jersey_num: '27', is_guest: false, created_at: '' },
    '6': { id: '6', user_id: '1', name: 'Robert Miller', jersey_num: '28', is_guest: false, created_at: '' },
  };

  // Add guest players dynamically
  const getAllPlayers = () => {
    const allGamePlayers = [...teamA, ...teamB];
    const allPlayerData: { [key: string]: Player } = { ...mockPlayers };
    
    // Add any guest players that aren't in mockPlayers
    allGamePlayers.forEach((gamePlayer) => {
      if (!allPlayerData[gamePlayer.player_id] && gamePlayer.player_id.startsWith('guest_')) {
        // This is a guest player, create mock data
        allPlayerData[gamePlayer.player_id] = {
          id: gamePlayer.player_id,
          user_id: '1',
          name: `Guest Player`,
          jersey_num: '--',
          is_guest: true,
          created_at: '',
        };
      }
    });
    
    return allPlayerData;
  };

  return (
    <GestureHandlerRootView style={styles.container}>
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* Main row: Clock with controls and action buttons */}
        <View style={styles.headerMainRow}>
          {/* Clock Section */}
          <View style={styles.clockSection}>
            <TouchableOpacity onPress={toggleClock} style={styles.clockControlButton}>
              <Ionicons 
                name={isRunning ? "pause" : "play"} 
                size={16} 
                color={theme.text}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleClock} style={styles.clockContainer}>
              <Text style={styles.clock}>{formatTime(elapsedTime)}</Text>
              <Text style={styles.clockLabel}>{isRunning ? 'PAUSE' : 'START'}</Text>
            </TouchableOpacity>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity onPress={undoLastEvent} style={styles.undoButton}>
              <Ionicons name="arrow-undo" size={14} color={theme.primary} />
              <Text style={styles.undoText}>UNDO</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleEndGame} style={styles.endButton}>
              <Ionicons name="stop" size={14} color="#fff" />
              <Text style={styles.endText}>END</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Points row */}
        <View style={styles.pointsRow}>
          <View style={styles.teamPointsSection}>
            <Text style={styles.teamPoints}>{teamA.reduce((sum, p) => sum + calculatePlayerStats(p).points, 0)}</Text>
            <Text style={styles.pointsLabel}>Points</Text>
            <Text style={styles.teamPoints}>{teamB.reduce((sum, p) => sum + calculatePlayerStats(p).points, 0)}</Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Team A Column */}
        <View style={styles.teamColumn}>
          <Text style={styles.teamLabel}>Team A</Text>
          <View style={styles.playersContainer}>
            {teamA.map((gamePlayer) => {
              const allPlayers = getAllPlayers();
              const player = allPlayers[gamePlayer.player_id] || { 
                id: gamePlayer.player_id, 
                name: 'Unknown', 
                user_id: '', 
                is_guest: false, 
                created_at: '' 
              };
              return (
                <PlayerBox
                  key={gamePlayer.id}
                  gamePlayer={gamePlayer}
                  player={player}
                  isSelected={selectedPlayer?.id === gamePlayer.id}
                  onPress={() => selectPlayer(gamePlayer)}
                  stats={calculatePlayerStats(gamePlayer)}
                  fullStats={calculateFullStats(gamePlayer)}
                />
              );
            })}
          </View>
        </View>

        {/* Team B Column */}
        <View style={styles.teamColumn}>
          <Text style={styles.teamLabel}>Team B</Text>
          <View style={styles.playersContainer}>
            {teamB.map((gamePlayer) => {
              const allPlayers = getAllPlayers();
              const player = allPlayers[gamePlayer.player_id] || { 
                id: gamePlayer.player_id, 
                name: 'Unknown', 
                user_id: '', 
                is_guest: false, 
                created_at: '' 
              };
              return (
                <PlayerBox
                  key={gamePlayer.id}
                  gamePlayer={gamePlayer}
                  player={player}
                  isSelected={selectedPlayer?.id === gamePlayer.id}
                  onPress={() => selectPlayer(gamePlayer)}
                  stats={calculatePlayerStats(gamePlayer)}
                  fullStats={calculateFullStats(gamePlayer)}
                />
              );
            })}
          </View>
        </View>
      </View>

      {/* Shot Type Modal */}
      <Modal
        visible={showShotTypeModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Shot Type</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => handleShotType('2pt')}
              >
                <Text style={styles.modalButtonText}>2 PT</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => handleShotType('3pt')}
              >
                <Text style={styles.modalButtonText}>3 PT</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Assist Modal */}
      <Modal
        visible={showAssistModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assist By</Text>
            <ScrollView style={styles.assistList}>
              {[...teamA, ...teamB]
                .filter((p) => p.id !== selectedPlayer?.id)
                .map((gamePlayer) => {
                  const allPlayers = getAllPlayers();
                  const player = allPlayers[gamePlayer.player_id];
                  return (
                    <TouchableOpacity
                      key={gamePlayer.id}
                      style={styles.assistOption}
                      onPress={() => handleAssistSelect(gamePlayer.id)}
                    >
                      <Text style={styles.assistOptionText}>
                        {player?.name || 'Unknown'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalButton, { marginTop: 16 }]}
              onPress={() => handleAssistSelect(null)}
            >
              <Text style={styles.modalButtonText}>No Assist</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* SwipeZone at bottom */}
      <SwipeZone
        onStatRecorded={handleStatRecorded}
        disabled={false}
        allPlayers={getAllPlayers()}
        teamA={teamA}
        teamB={teamB}
      />
    </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  clockSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clockControlButton: {
    padding: 8,
    backgroundColor: theme.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockContainer: {
    position: 'relative',
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'flex-start',
    width: 160,
  },
  clock: {
    fontSize: 28,
    fontFamily: FONTS.orbitron.bold,
    color: theme.text,
    marginTop: 0,
    position: 'relative',
    left: 0,
    width: '100%',
  },
  clockLabel: {
    fontSize: 8,
    fontFamily: FONTS.inter.regular,
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
    position: 'absolute',
    bottom: -14,
    left: -50,
    right: 0,
    textAlign: 'center',
  },
  pointsRow: {
    paddingTop: 8,
    alignItems: 'center',
  },
  teamPointsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  teamPoints: {
    fontSize: 28,
    fontFamily: FONTS.orbitron.bold,
    color: theme.primary,
  },
  pointsLabel: {
    fontSize: 10,
    fontFamily: FONTS.inter.medium,
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 'auto',
  },
  undoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.primary,
  },
  undoText: {
    fontSize: 10,
    fontFamily: FONTS.inter.medium,
    color: theme.primary,
  },
  endButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ff3b30',
    borderRadius: 16,
  },
  endText: {
    fontSize: 10,
    fontFamily: FONTS.inter.medium,
    color: '#fff',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  teamColumn: {
    width: '50%',
    paddingBottom: 12,
  },
  playersContainer: {
    flex: 1,
  },
  teamLabel: {
    fontSize: 18,
    fontFamily: FONTS.orbitron.bold,
    textAlign: 'center',
    backgroundColor: theme.surface,
    color: theme.text,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: FONTS.orbitron.bold,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.inter.medium,
  },
  assistList: {
    maxHeight: 300,
  },
  assistOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  assistOptionText: {
    fontSize: 16,
    fontFamily: FONTS.inter.regular,
  },
});