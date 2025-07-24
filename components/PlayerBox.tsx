import React, { useState } from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  View,
  ViewStyle,
  Pressable,
} from 'react-native';
import { GamePlayer, Player } from '../lib/supabase';
import { PlayerStatsModal } from './PlayerStatsModal';
import { FONTS } from '../constants/fonts';

interface PlayerBoxProps {
  gamePlayer: GamePlayer;
  player: Player;
  isSelected: boolean;
  onPress: () => void;
  stats?: {
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
  };
  fullStats?: any;
  style?: ViewStyle;
}

export const PlayerBox: React.FC<PlayerBoxProps> = ({
  gamePlayer,
  player,
  isSelected,
  onPress,
  stats,
  fullStats,
  style,
}) => {
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [isLongPress, setIsLongPress] = useState(false);

  const handlePressIn = () => {
    // Start timer for long press detection
    const timer = setTimeout(() => {
      setIsLongPress(true);
      setShowStatsModal(true);
    }, 200); // 200ms to detect as long press
    
    // Store timer to clear it if needed
    (global as any).playerBoxTimer = timer;
  };

  const handlePressOut = () => {
    // Clear the timer
    if ((global as any).playerBoxTimer) {
      clearTimeout((global as any).playerBoxTimer);
    }
    
    // If it was a long press, hide modal on release
    if (isLongPress) {
      setShowStatsModal(false);
      setIsLongPress(false);
    }
  };

  const handlePress = () => {
    // If it wasn't a long press, show modal on tap
    if (!isLongPress) {
      setShowStatsModal(true);
    }
  };

  return (
    <>
      <Pressable
        style={[
          styles.container,
          isSelected && styles.selected,
          gamePlayer.team === 'A' ? styles.teamA : styles.teamB,
          style,
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
      <View style={styles.header}>
        <Text style={styles.jersey}>
          {player.jersey_num || '--'}
        </Text>
        <Text style={styles.name} numberOfLines={1}>
          {player.name}
        </Text>
      </View>
      
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>PTS</Text>
            <Text style={styles.statValue}>{stats.points}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>REB</Text>
            <Text style={styles.statValue}>{stats.rebounds}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>AST</Text>
            <Text style={styles.statValue}>{stats.assists}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>STL</Text>
            <Text style={styles.statValue}>{stats.steals}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>BLK</Text>
            <Text style={styles.statValue}>{stats.blocks}</Text>
          </View>
        </View>
      )}
      </Pressable>

      <PlayerStatsModal
        visible={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        player={player}
        gamePlayer={gamePlayer}
        currentGameStats={fullStats || {
          points: stats?.points || 0,
          fieldGoalsMade: 0,
          fieldGoalsAttempted: 0,
          threePointersMade: 0,
          threePointersAttempted: 0,
          twoPointersMade: 0,
          twoPointersAttempted: 0,
          rebounds: stats?.rebounds || 0,
          assists: stats?.assists || 0,
          steals: stats?.steals || 0,
          blocks: stats?.blocks || 0,
          turnovers: 0,
          fouls: 0,
        }}
        careerStats={{
          gamesPlayed: 42,
          pointsPerGame: 12.5,
          assistsPerGame: 3.2,
          reboundsPerGame: 5.8,
          stealsPerGame: 1.1,
          blocksPerGame: 0.7,
          fieldGoalPercentage: 45.2,
          threePointPercentage: 35.8,
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#37464D',
    padding: 12,
    borderWidth: 1,
    borderColor: '#2B373F',
  },
  selected: {
    borderColor: '#FF6723',
    backgroundColor: 'rgba(255, 103, 35, 0.2)',
    borderWidth: 2,
  },
  teamA: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  teamB: {
    borderRightWidth: 4,
    borderRightColor: '#4ECDC4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  jersey: {
    fontSize: 24,
    fontFamily: FONTS.orbitron.bold,
    marginRight: 8,
    minWidth: 40,
    color: '#fff',
  },
  name: {
    fontSize: 16,
    fontFamily: FONTS.orbitron.medium,
    flex: 1,
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statRow: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontFamily: FONTS.inter.regular,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  statValue: {
    fontSize: 14,
    fontFamily: FONTS.orbitron.medium,
    color: '#fff',
  },
});