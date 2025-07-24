import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSessionStore } from '../stores/sessionStore';
import { supabase } from '../lib/supabase';
import { formatHooperCode, isValidHooperCode } from '../utils/hooperCode';
import { useTheme } from '../contexts/ThemeContext';
import { FONTS } from '../constants/fonts';

interface Friend {
  id: string;
  hooper_code: string;
  display_name: string;
}

export const FriendsScreen = () => {
  const { user, guestUser, profile } = useSessionStore();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [searchCode, setSearchCode] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const myHooperCode = guestUser?.hooperCode || profile?.hooper_code || '';

  const handleSearch = async () => {
    const searchTerm = searchCode.trim();
    
    if (!searchTerm) {
      Alert.alert('Error', 'Please enter a hooper code or username');
      return;
    }

    // Check if it's a hooper code format (6 alphanumeric characters)
    const cleanCode = searchTerm.replace(/[-\s]/g, '').toUpperCase();
    const isHooperCode = isValidHooperCode(cleanCode);

    if (isHooperCode && cleanCode === myHooperCode) {
      Alert.alert('Error', "You can't add yourself as a friend");
      return;
    }

    try {
      setSearching(true);
      
      let data = null;
      let error = null;

      if (isHooperCode) {
        // Search by hooper code
        const result = await supabase
          .from('profiles')
          .select('id, hooper_code, display_name, username')
          .eq('hooper_code', cleanCode)
          .single();
        data = result.data;
        error = result.error;
      } else {
        // Search by username (case insensitive)
        const result = await supabase
          .from('profiles')
          .select('id, hooper_code, display_name, username')
          .ilike('username', searchTerm)
          .single();
        data = result.data;
        error = result.error;
      }

      if (error || !data) {
        Alert.alert('Not Found', `No player found with that ${isHooperCode ? 'hooper code' : 'username'}`);
        return;
      }

      // Check if it's the user themselves
      if (data.hooper_code === myHooperCode) {
        Alert.alert('Error', "You can't add yourself as a friend");
        return;
      }

      // Check if already friends
      const isAlreadyFriend = friends.some(f => f.id === data.id);
      if (isAlreadyFriend) {
        Alert.alert('Already Friends', 'This player is already in your friends list');
        return;
      }

      // Add to friends list
      setFriends([...friends, data]);
      setSearchCode('');
      Alert.alert('Success', `Added ${data.display_name} to your friends!`);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search for player');
    } finally {
      setSearching(false);
    }
  };

  const removeFriend = (friendId: string) => {
    Alert.alert(
      'Remove Friend',
      'Are you sure you want to remove this friend?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            setFriends(friends.filter(f => f.id !== friendId));
          }
        }
      ]
    );
  };

  const renderFriend = ({ item }: { item: Friend }) => (
    <View style={styles.friendItem}>
      <View>
        <Text style={styles.friendName}>{item.display_name}</Text>
        <Text style={styles.friendCode}>{formatHooperCode(item.hooper_code)}</Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeFriend(item.id)}
      >
        <Ionicons name="person-remove" size={20} color="#FF4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Friends</Text>
        {myHooperCode && (
          <View style={styles.myCodeContainer}>
            <Text style={styles.myCodeLabel}>Your Hooper Code:</Text>
            <Text style={styles.myCode}>{formatHooperCode(myHooperCode)}</Text>
          </View>
        )}
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Enter hooper code or username"
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={searchCode}
          onChangeText={setSearchCode}
          autoCapitalize="none"
          maxLength={30}
        />
        <TouchableOpacity
          style={[styles.searchButton, searching && styles.disabledButton]}
          onPress={handleSearch}
          disabled={searching}
        >
          {searching ? (
            <ActivityIndicator color="#131E24" size="small" />
          ) : (
            <Ionicons name="search" size={24} color="#131E24" />
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#FF6723" size="large" />
        </View>
      ) : friends.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#37464D" />
          <Text style={styles.emptyText}>No friends yet</Text>
          <Text style={styles.emptySubtext}>
            Search for friends using their hooper code or username
          </Text>
        </View>
      ) : (
        <FlatList
          data={friends}
          renderItem={renderFriend}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
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
    marginBottom: 16,
  },
  myCodeContainer: {
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  myCodeLabel: {
    fontSize: 14,
    fontFamily: FONTS.inter.regular,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  myCode: {
    fontSize: 24,
    fontFamily: FONTS.orbitron.bold,
    color: theme.primary,
    letterSpacing: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 10,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: FONTS.inter.regular,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.border,
    textTransform: 'uppercase',
  },
  searchButton: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: FONTS.inter.medium,
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: FONTS.inter.regular,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  friendItem: {
    backgroundColor: '#37464D',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#2B373F',
  },
  friendName: {
    fontSize: 16,
    fontFamily: FONTS.orbitron.medium,
    color: '#fff',
    marginBottom: 4,
  },
  friendCode: {
    fontSize: 14,
    fontFamily: FONTS.inter.regular,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 1,
  },
  removeButton: {
    padding: 8,
  },
});