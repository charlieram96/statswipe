import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useBasketballSessionStore } from '../stores/basketballSessionStore';
import { useTheme } from '../contexts/ThemeContext';
import { Session } from '../lib/supabase';
import { FONTS } from '../constants/fonts';

export const HistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { sessions, loadSessions } = useBasketballSessionStore();
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    // Load sessions when component mounts
    loadSessions();
    setLoading(false);
  }, []);

  const formatSessionDate = (startedAt: string) => {
    const date = new Date(startedAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const formatSessionTime = (startedAt: string, endedAt?: string) => {
    const start = new Date(startedAt);
    const end = endedAt ? new Date(endedAt) : null;
    
    const startTime = start.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });

    if (!end) {
      return `Started at ${startTime}`;
    }

    const duration = Math.floor((end.getTime() - start.getTime()) / 1000 / 60); // minutes
    return `${startTime} • ${duration} min`;
  };

  const getSessionStats = (session: Session) => {
    // Mock stats for now - in a real app, this would be calculated from games
    const gamesCount = Math.floor(Math.random() * 5) + 1;
    const totalPoints = Math.floor(Math.random() * 100) + 50;
    return { gamesCount, totalPoints };
  };

  const renderSession = ({ item }: { item: Session }) => {
    const stats = getSessionStats(item);
    
    return (
      <TouchableOpacity 
        style={styles.sessionCard}
        onPress={() => {
          // Navigate to session details (to be implemented)
          console.log('Navigate to session:', item.id);
        }}
      >
        <View style={styles.sessionHeader}>
          <View>
            <Text style={styles.sessionDate}>{formatSessionDate(item.started_at)}</Text>
            <Text style={styles.sessionName}>{item.name}</Text>
            {item.location && (
              <View style={styles.locationContainer}>
                <Ionicons name="location-sharp" size={12} color={theme.textSecondary} />
                <Text style={styles.sessionLocation}>{item.location}</Text>
              </View>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </View>
        
        <View style={styles.sessionStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.gamesCount}</Text>
            <Text style={styles.statLabel}>Games</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalPoints}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatSessionTime(item.started_at, item.ended_at)}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="basketball-outline" size={64} color={theme.textSecondary} />
      <Text style={styles.emptyTitle}>No Sessions Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start a new game to begin tracking your basketball sessions
      </Text>
      <TouchableOpacity 
        style={styles.startButton}
        onPress={() => (navigation as any).navigate('NewGame')}
      >
        <Text style={styles.startButtonText}>Start New Game</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Sessions</Text>
        <Text style={styles.subtitle}>Your basketball session history</Text>
      </View>
      
      {sessions.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderSession}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontFamily: FONTS.orbitron.bold,
    color: theme.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FONTS.inter.regular,
    color: theme.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    paddingTop: 10,
  },
  sessionCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sessionDate: {
    fontSize: 12,
    fontFamily: FONTS.inter.regular,
    color: theme.primary,
    marginBottom: 4,
  },
  sessionName: {
    fontSize: 18,
    fontFamily: FONTS.orbitron.bold,
    color: theme.text,
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sessionLocation: {
    fontSize: 14,
    fontFamily: FONTS.inter.regular,
    color: theme.textSecondary,
  },
  sessionStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontFamily: FONTS.orbitron.bold,
    color: theme.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: FONTS.inter.regular,
    color: theme.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.border,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: FONTS.orbitron.bold,
    color: theme.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: FONTS.inter.regular,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  startButtonText: {
    fontSize: 16,
    fontFamily: FONTS.inter.medium,
    color: theme.background,
  },
});