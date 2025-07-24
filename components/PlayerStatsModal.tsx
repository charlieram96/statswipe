import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Player, GamePlayer } from '../lib/supabase';
import { FONTS } from '../constants/fonts';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeColors } from '../constants/themes';

interface PlayerStats {
  // Current game stats
  points: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointersMade: number;
  threePointersAttempted: number;
  twoPointersMade: number;
  twoPointersAttempted: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
}

interface CareerStats {
  gamesPlayed: number;
  pointsPerGame: number;
  assistsPerGame: number;
  reboundsPerGame: number;
  stealsPerGame: number;
  blocksPerGame: number;
  fieldGoalPercentage: number;
  threePointPercentage: number;
}

interface PlayerStatsModalProps {
  visible: boolean;
  onClose: () => void;
  player: Player;
  gamePlayer: GamePlayer;
  currentGameStats: PlayerStats;
  careerStats?: CareerStats;
}

export const PlayerStatsModal: React.FC<PlayerStatsModalProps> = ({
  visible,
  onClose,
  player,
  gamePlayer,
  currentGameStats,
  careerStats,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  const fieldGoalPercentage = currentGameStats.fieldGoalsAttempted > 0
    ? ((currentGameStats.fieldGoalsMade / currentGameStats.fieldGoalsAttempted) * 100).toFixed(1)
    : '0.0';

  const threePointPercentage = currentGameStats.threePointersAttempted > 0
    ? ((currentGameStats.threePointersMade / currentGameStats.threePointersAttempted) * 100).toFixed(1)
    : '0.0';

  const twoPointPercentage = currentGameStats.twoPointersAttempted > 0
    ? ((currentGameStats.twoPointersMade / currentGameStats.twoPointersAttempted) * 100).toFixed(1)
    : '0.0';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalContent, { flex: 1 }]}>
              {/* Header */}
              <View style={[
                styles.header,
                gamePlayer.team === 'A' ? styles.teamAHeader : styles.teamBHeader
              ]}>
                <Text style={styles.playerName}>{player.name}</Text>
                {player.jersey_num && (
                  <Text style={styles.jerseyNumber}>#{player.jersey_num}</Text>
                )}
              </View>

              <ScrollView 
                style={styles.statsContainer} 
                contentContainerStyle={styles.statsContentContainer}
                showsVerticalScrollIndicator={false}
                bounces={true}
              >
                {/* Current Game Stats */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Current Game</Text>
                  
                  {/* Main Stats */}
                  <View style={styles.mainStats}>
                    <View style={styles.mainStatItem}>
                      <Text style={styles.mainStatValue}>{currentGameStats.points}</Text>
                      <Text style={styles.mainStatLabel}>PTS</Text>
                    </View>
                    <View style={styles.mainStatItem}>
                      <Text style={styles.mainStatValue}>{currentGameStats.rebounds}</Text>
                      <Text style={styles.mainStatLabel}>REB</Text>
                    </View>
                    <View style={styles.mainStatItem}>
                      <Text style={styles.mainStatValue}>{currentGameStats.assists}</Text>
                      <Text style={styles.mainStatLabel}>AST</Text>
                    </View>
                  </View>

                  {/* Shooting Stats */}
                  <View style={styles.shootingStats}>
                    <Text style={styles.subSectionTitle}>Shooting</Text>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Field Goals</Text>
                      <Text style={styles.statValue}>
                        {currentGameStats.fieldGoalsMade}/{currentGameStats.fieldGoalsAttempted} ({fieldGoalPercentage}%)
                      </Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>2-Pointers</Text>
                      <Text style={styles.statValue}>
                        {currentGameStats.twoPointersMade}/{currentGameStats.twoPointersAttempted} ({twoPointPercentage}%)
                      </Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>3-Pointers</Text>
                      <Text style={styles.statValue}>
                        {currentGameStats.threePointersMade}/{currentGameStats.threePointersAttempted} ({threePointPercentage}%)
                      </Text>
                    </View>
                  </View>

                  {/* Other Stats */}
                  <View style={styles.otherStats}>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Steals</Text>
                      <Text style={styles.statValue}>{currentGameStats.steals}</Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Blocks</Text>
                      <Text style={styles.statValue}>{currentGameStats.blocks}</Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Turnovers</Text>
                      <Text style={styles.statValue}>{currentGameStats.turnovers}</Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Fouls</Text>
                      <Text style={styles.statValue}>{currentGameStats.fouls}</Text>
                    </View>
                  </View>
                </View>
                
                {/* Career Stats - Compact Section */}
                {careerStats && (
                  <View style={styles.careerSection}>
                    <Text style={styles.careerSectionTitle}>Career Averages</Text>
                    <View style={styles.careerStatsGrid}>
                      <View style={styles.careerStatItem}>
                        <Text style={styles.careerStatValue}>{careerStats.gamesPlayed}</Text>
                        <Text style={styles.careerStatLabel}>GP</Text>
                      </View>
                      <View style={styles.careerStatItem}>
                        <Text style={styles.careerStatValue}>{careerStats.pointsPerGame.toFixed(1)}</Text>
                        <Text style={styles.careerStatLabel}>PPG</Text>
                      </View>
                      <View style={styles.careerStatItem}>
                        <Text style={styles.careerStatValue}>{careerStats.assistsPerGame.toFixed(1)}</Text>
                        <Text style={styles.careerStatLabel}>APG</Text>
                      </View>
                      <View style={styles.careerStatItem}>
                        <Text style={styles.careerStatValue}>{careerStats.reboundsPerGame.toFixed(1)}</Text>
                        <Text style={styles.careerStatLabel}>RPG</Text>
                      </View>
                      <View style={styles.careerStatItem}>
                        <Text style={styles.careerStatValue}>{careerStats.fieldGoalPercentage.toFixed(1)}%</Text>
                        <Text style={styles.careerStatLabel}>FG%</Text>
                      </View>
                      <View style={styles.careerStatItem}>
                        <Text style={styles.careerStatValue}>{careerStats.threePointPercentage.toFixed(1)}%</Text>
                        <Text style={styles.careerStatLabel}>3P%</Text>
                      </View>
                    </View>
                  </View>
                )}
              </ScrollView>

              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const createStyles = (theme: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: theme.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 2,
    borderBottomColor: theme.border,
  },
  teamAHeader: {
    backgroundColor: theme.surface,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  teamBHeader: {
    backgroundColor: theme.surface,
    borderRightWidth: 4,
    borderRightColor: '#4ECDC4',
  },
  playerName: {
    fontSize: 20,
    fontFamily: FONTS.orbitron.bold,
    flex: 1,
    color: theme.text,
  },
  jerseyNumber: {
    fontSize: 24,
    fontFamily: FONTS.orbitron.bold,
    color: theme.textSecondary,
  },
  statsContainer: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.orbitron.bold,
    marginBottom: 12,
    color: theme.text,
  },
  subSectionTitle: {
    fontSize: 16,
    fontFamily: FONTS.inter.medium,
    marginBottom: 8,
    marginTop: 12,
    color: theme.textSecondary,
  },
  mainStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 16,
    backgroundColor: theme.background,
    borderRadius: 8,
  },
  mainStatItem: {
    alignItems: 'center',
  },
  mainStatValue: {
    fontSize: 32,
    fontFamily: FONTS.orbitron.bold,
    color: theme.primary,
  },
  mainStatLabel: {
    fontSize: 12,
    fontFamily: FONTS.inter.regular,
    color: theme.textSecondary,
    marginTop: 4,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: FONTS.inter.regular,
    color: theme.textSecondary,
  },
  statValue: {
    fontSize: 14,
    fontFamily: FONTS.inter.medium,
    color: theme.text,
  },
  shootingStats: {
    marginBottom: 16,
  },
  otherStats: {
    marginTop: 8,
  },
  careerSection: {
    padding: 16,
    backgroundColor: theme.background,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  careerSectionTitle: {
    fontSize: 14,
    fontFamily: FONTS.inter.medium,
    marginBottom: 12,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  careerStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  careerStatItem: {
    alignItems: 'center',
    width: '30%',
    marginBottom: 8,
  },
  careerStatValue: {
    fontSize: 16,
    fontFamily: FONTS.orbitron.medium,
    color: theme.text,
  },
  careerStatLabel: {
    fontSize: 10,
    fontFamily: FONTS.inter.regular,
    color: theme.textSecondary,
    marginTop: 2,
  },
  statsContentContainer: {
    paddingBottom: 16,
  },
  closeButton: {
    backgroundColor: theme.primary,
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  closeButtonText: {
    color: theme.background,
    fontSize: 16,
    fontFamily: FONTS.inter.medium,
  },
});