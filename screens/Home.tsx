import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSessionStore } from '../stores/sessionStore';
import { formatHooperCode } from '../utils/hooperCode';
import { useTheme } from '../contexts/ThemeContext';
import { FONTS } from '../constants/fonts';
import { ThemeColors } from '../constants/themes';

const { width } = Dimensions.get('window');

// Mock data for development
const mockStats = {
  totalGames: 47,
  gamesWon: 32,
  gamesLost: 15,
  winPercentage: 68,
  averagePoints: 18.5,
  totalPoints: 869,
};

const mockLatestGame = {
  id: '1',
  mode: '3v3',
  result: 'W',
  finalScore: '21-18',
  date: '2 hours ago',
  players: ['John S.', 'Mike J.', 'You', 'vs', 'David W.', 'Chris B.', 'James D.'],
};

const mockRecentFriendsGames = [
  {
    id: '1',
    playerName: 'John Smith',
    hooperCode: 'AB12CD',
    mode: '2v2',
    result: 'W',
    score: '15-12',
    timeAgo: '1h ago',
  },
  {
    id: '2',
    playerName: 'Mike Johnson',
    hooperCode: 'EF34GH',
    mode: '5v5',
    result: 'L',
    score: '28-35',
    timeAgo: '3h ago',
  },
  {
    id: '3',
    playerName: 'David Williams',
    hooperCode: 'IJ56KL',
    mode: '1v1',
    result: 'W',
    score: '11-8',
    timeAgo: '5h ago',
  },
];

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, guestUser, profile } = useSessionStore();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  const displayName = guestUser?.displayName || profile?.display_name || user?.email || 'Player';
  const username = profile?.username || (user?.email ? user.email.split('@')[0] : '');
  const hooperCode = guestUser?.hooperCode || profile?.hooper_code || '';

  const navigateToSetup = () => {
    (navigation as any).navigate('NewGame');
  };

  const navigateToHistory = () => {
    (navigation as any).navigate('My Games');
  };

  const navigateToFriends = () => {
    (navigation as any).navigate('Friends');
  };

  const StatCard = ({ title, value, subtitle, icon }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: keyof typeof Ionicons.glyphMap;
  }) => (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={24} color="#FF6723" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.playerName}>{displayName}</Text>
            <Text style={styles.username}>@{username}</Text>
            {hooperCode && (
              <Text style={styles.hooperCode}>{formatHooperCode(hooperCode)}</Text>
            )}
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => (navigation as any).navigate('Me')}
          >
            <Ionicons name="person-circle" size={48} color="#FF6723" />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.newGameButton} onPress={navigateToSetup}>
            <View style={styles.newGameIcon}>
              <Ionicons name="add" size={32} color="#131E24" />
            </View>
            <View style={styles.newGameText}>
              <Text style={styles.newGameTitle}>Start New Game</Text>
              <Text style={styles.newGameSubtitle}>Set up teams and begin</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="rgba(255, 255, 255, 0.5)" />
          </TouchableOpacity>
        </View>

        {/* Stats Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <StatCard 
              title="Games Played" 
              value={mockStats.totalGames} 
              icon="basketball" 
            />
            <StatCard 
              title="Win Rate" 
              value={`${mockStats.winPercentage}%`} 
              subtitle={`${mockStats.gamesWon}W ${mockStats.gamesLost}L`}
              icon="trophy" 
            />
            <StatCard 
              title="Avg Points" 
              value={mockStats.averagePoints} 
              icon="trending-up" 
            />
            <StatCard 
              title="Total Points" 
              value={mockStats.totalPoints} 
              icon="stats-chart" 
            />
          </View>
        </View>

        {/* Latest Game */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Latest Game</Text>
            <TouchableOpacity onPress={navigateToHistory}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.gameCard} onPress={navigateToHistory}>
            <View style={styles.gameHeader}>
              <View style={styles.gameMode}>
                <Text style={styles.gameModeText}>{mockLatestGame.mode}</Text>
              </View>
              <View style={[
                styles.gameResult, 
                mockLatestGame.result === 'W' ? styles.winResult : styles.lossResult
              ]}>
                <Text style={styles.gameResultText}>{mockLatestGame.result}</Text>
              </View>
            </View>
            <Text style={styles.gameScore}>{mockLatestGame.finalScore}</Text>
            <Text style={styles.gamePlayers}>{mockLatestGame.players.join(' ')}</Text>
            <Text style={styles.gameTime}>{mockLatestGame.date}</Text>
          </TouchableOpacity>
        </View>

        {/* Friends Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Friends Activity</Text>
            <TouchableOpacity onPress={navigateToFriends}>
              <Text style={styles.seeAllText}>View friends</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.friendsActivity}>
            {mockRecentFriendsGames.map((game) => (
              <View key={game.id} style={styles.friendGameCard}>
                <View style={styles.friendInfo}>
                  <Text style={styles.friendName}>{game.playerName}</Text>
                  <Text style={styles.friendCode}>{formatHooperCode(game.hooperCode)}</Text>
                </View>
                <View style={styles.friendGameInfo}>
                  <Text style={styles.friendGameMode}>{game.mode}</Text>
                  <Text style={[
                    styles.friendGameResult,
                    game.result === 'W' ? styles.friendWin : styles.friendLoss
                  ]}>
                    {game.result} {game.score}
                  </Text>
                  <Text style={styles.friendGameTime}>{game.timeAgo}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickLinks}>
            <TouchableOpacity style={styles.quickLink} onPress={navigateToHistory}>
              <Ionicons name="list" size={24} color="#FF6723" />
              <Text style={styles.quickLinkText}>My Games</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickLink} onPress={navigateToFriends}>
              <Ionicons name="people" size={24} color="#FF6723" />
              <Text style={styles.quickLinkText}>Friends</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickLink} onPress={() => (navigation as any).navigate('Me')}>
              <Ionicons name="person" size={24} color="#FF6723" />
              <Text style={styles.quickLinkText}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  welcomeText: {
    fontSize: 16,
    fontFamily: FONTS.inter.regular,
    color: theme.textSecondary,
  },
  playerName: {
    fontSize: 24,
    fontFamily: FONTS.orbitron.bold,
    color: '#fff',
    marginTop: 4,
  },
  username: {
    fontSize: 14,
    fontFamily: FONTS.inter.regular,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  hooperCode: {
    fontSize: 14,
    fontFamily: FONTS.orbitron.medium,
    color: '#FF6723',
    marginTop: 4,
    letterSpacing: 1,
  },
  profileButton: {
    padding: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: FONTS.orbitron.bold,
    color: '#fff',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: FONTS.inter.medium,
    color: '#FF6723',
  },
  newGameButton: {
    backgroundColor: '#37464D',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2B373F',
  },
  newGameIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6723',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  newGameText: {
    flex: 1,
  },
  newGameTitle: {
    fontSize: 18,
    fontFamily: FONTS.orbitron.bold,
    color: '#fff',
    marginBottom: 4,
  },
  newGameSubtitle: {
    fontSize: 14,
    fontFamily: FONTS.inter.regular,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#37464D',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: (width - 56) / 2,
    borderWidth: 1,
    borderColor: '#2B373F',
  },
  statValue: {
    fontSize: 24,
    fontFamily: FONTS.orbitron.bold,
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    fontFamily: FONTS.inter.medium,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  statSubtitle: {
    fontSize: 10,
    fontFamily: FONTS.inter.regular,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
    textAlign: 'center',
  },
  gameCard: {
    backgroundColor: '#37464D',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2B373F',
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gameMode: {
    backgroundColor: '#131E24',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gameModeText: {
    fontSize: 12,
    fontFamily: FONTS.orbitron.medium,
    color: '#FF6723',
  },
  gameResult: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  winResult: {
    backgroundColor: 'rgba(255, 103, 35, 0.2)',
  },
  lossResult: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
  },
  gameResultText: {
    fontSize: 12,
    fontFamily: FONTS.orbitron.bold,
    color: '#fff',
  },
  gameScore: {
    fontSize: 20,
    fontFamily: FONTS.orbitron.bold,
    color: '#fff',
    marginBottom: 4,
  },
  gamePlayers: {
    fontSize: 14,
    fontFamily: FONTS.inter.regular,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  gameTime: {
    fontSize: 12,
    fontFamily: FONTS.inter.regular,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  friendsActivity: {
    gap: 12,
  },
  friendGameCard: {
    backgroundColor: '#37464D',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2B373F',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 14,
    fontFamily: FONTS.inter.medium,
    color: '#fff',
    marginBottom: 2,
  },
  friendCode: {
    fontSize: 12,
    fontFamily: FONTS.inter.regular,
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.5,
  },
  friendGameInfo: {
    alignItems: 'flex-end',
  },
  friendGameMode: {
    fontSize: 12,
    fontFamily: FONTS.orbitron.medium,
    color: '#FF6723',
    marginBottom: 2,
  },
  friendGameResult: {
    fontSize: 12,
    fontFamily: FONTS.inter.medium,
    marginBottom: 2,
  },
  friendWin: {
    color: '#FF6723',
  },
  friendLoss: {
    color: '#ff3b30',
  },
  friendGameTime: {
    fontSize: 10,
    fontFamily: FONTS.inter.regular,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  quickLinks: {
    flexDirection: 'row',
    gap: 12,
  },
  quickLink: {
    flex: 1,
    backgroundColor: '#37464D',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2B373F',
  },
  quickLinkText: {
    fontSize: 12,
    color: theme.text,
    fontFamily: FONTS.inter.medium,
    marginTop: 8,
  },
});