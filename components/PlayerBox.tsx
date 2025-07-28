import React, { useState } from 'react';
import { 
  Text, 
  StyleSheet, 
  View,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GamePlayer, Player } from '../lib/supabase';
import { PlayerStatsModal } from './PlayerStatsModal';
import { ProfileAvatar } from './ProfileAvatar';
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

  return (
    <>
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.container,
          isSelected && styles.selected,
          gamePlayer.team === 'A' ? styles.teamA : styles.teamB,
          style,
        ]}
      >
        <View style={styles.header}>
          <ProfileAvatar 
            imageUrl={player.profile_image_url}
            size={40}
          />
          <Text style={styles.name} numberOfLines={1}>
            {player.name}
          </Text>
          <TouchableOpacity 
            style={styles.statsButton}
            onPress={() => setShowStatsModal(true)}
          >
            <Ionicons name="stats-chart" size={16} color="#fff" />
          </TouchableOpacity>
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
        
      </TouchableOpacity>

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
    paddingTop: 2,
    paddingBottom: 6,
    paddingLeft: 8,
    paddingRight: 8,
    borderWidth: 3,
    borderColor: 'transparent',
    borderRadius: 8,
    marginVertical: 2,
    marginHorizontal: 2,
    // Add subtle border
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  selected: {
    borderColor: '#ffffff',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
  statsButton: {
    marginLeft: 8,
    padding: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
  },
  jersey: {
    fontSize: 14,
    fontFamily: FONTS.orbitron.medium,
    marginLeft: 8,
    minWidth: 30,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'right',
  },
  name: {
    fontSize: 14,
    fontFamily: FONTS.orbitron.medium,
    flex: 1,
    color: '#fff',
    marginLeft: 12,
  },
  statsContainer: {
    marginTop: -2,
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