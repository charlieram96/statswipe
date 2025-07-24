import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGameStore } from '../stores/gameStore';
import { GamePlayer } from '../lib/supabase';
import { FONTS } from '../constants/fonts';

interface MockPlayer {
  id: string;
  name: string;
  jersey_num?: string;
  is_guest: boolean;
}

// Mock data for development
const mockFriends: MockPlayer[] = [
  { id: '1', name: 'John Smith', jersey_num: '23', is_guest: false },
  { id: '2', name: 'Mike Johnson', jersey_num: '24', is_guest: false },
  { id: '3', name: 'David Williams', jersey_num: '25', is_guest: false },
  { id: '4', name: 'Chris Brown', jersey_num: '26', is_guest: false },
  { id: '5', name: 'James Davis', jersey_num: '27', is_guest: false },
  { id: '6', name: 'Robert Miller', jersey_num: '28', is_guest: false },
];

export const RosterSelectScreen: React.FC = () => {
  const navigation = useNavigation();
  const { mode, setTeams, startGame } = useGameStore();
  
  const [selectedPlayers, setSelectedPlayers] = useState<MockPlayer[]>([]);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestJersey, setGuestJersey] = useState('');
  const [guestTeam, setGuestTeam] = useState<'A' | 'B'>('A');
  
  const totalPlayersNeeded = (mode || 1) * 2;
  
  const togglePlayer = (player: MockPlayer) => {
    setSelectedPlayers(prev => {
      const isSelected = prev.find(p => p.id === player.id);
      if (isSelected) {
        return prev.filter(p => p.id !== player.id);
      } else if (prev.length < totalPlayersNeeded) {
        return [...prev, player];
      } else {
        Alert.alert('Team Full', `You can only select ${totalPlayersNeeded} players for ${mode}v${mode}`);
        return prev;
      }
    });
  };
  
  const addGuest = () => {
    if (!guestName.trim()) {
      Alert.alert('Error', 'Guest name is required');
      return;
    }
    
    if (selectedPlayers.length >= totalPlayersNeeded) {
      Alert.alert('Team Full', `You can only select ${totalPlayersNeeded} players for ${mode}v${mode}`);
      return;
    }
    
    const newGuest: MockPlayer = {
      id: `guest_${Date.now()}`,
      name: guestName.trim(),
      jersey_num: guestJersey.trim() || undefined,
      is_guest: true,
    };
    
    setSelectedPlayers(prev => [...prev, newGuest]);
    setGuestName('');
    setGuestJersey('');
    setShowGuestModal(false);
  };
  
  const startGameWithTeams = () => {
    if (selectedPlayers.length !== totalPlayersNeeded) {
      Alert.alert('Incomplete Team', `Please select exactly ${totalPlayersNeeded} players`);
      return;
    }
    
    // Split players into teams
    const playersPerTeam = mode || 1;
    const teamA: GamePlayer[] = selectedPlayers.slice(0, playersPerTeam).map((player, index) => ({
      id: `game_player_a_${index}`,
      game_id: 'temp_game_id',
      player_id: player.id,
      team: 'A' as const,
    }));
    
    const teamB: GamePlayer[] = selectedPlayers.slice(playersPerTeam).map((player, index) => ({
      id: `game_player_b_${index}`,
      game_id: 'temp_game_id',
      player_id: player.id,
      team: 'B' as const,
    }));
    
    setTeams(teamA, teamB);
    startGame('temp_game_id');
    navigation.navigate('Game' as never);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Players</Text>
        <Text style={styles.subtitle}>
          Choose {totalPlayersNeeded} players for {mode}v{mode}
        </Text>
        <Text style={styles.counter}>
          {selectedPlayers.length}/{totalPlayersNeeded} selected
        </Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Friends</Text>
          {mockFriends.map((player) => (
            <TouchableOpacity
              key={player.id}
              style={[
                styles.playerItem,
                selectedPlayers.find(p => p.id === player.id) && styles.selectedPlayer
              ]}
              onPress={() => togglePlayer(player)}
            >
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{player.name}</Text>
                <Text style={styles.playerJersey}>#{player.jersey_num}</Text>
              </View>
              {selectedPlayers.find(p => p.id === player.id) && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Guests</Text>
          {selectedPlayers.filter(p => p.is_guest).map((player) => (
            <View key={player.id} style={[styles.playerItem, styles.selectedPlayer]}>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{player.name}</Text>
                <Text style={styles.playerJersey}>#{player.jersey_num || '--'}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedPlayers(prev => prev.filter(p => p.id !== player.id))}
              >
                <Text style={styles.removeButton}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          
          <TouchableOpacity
            style={styles.addGuestButton}
            onPress={() => setShowGuestModal(true)}
          >
            <Text style={styles.addGuestText}>+ Add Guest</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.startButton,
            selectedPlayers.length !== totalPlayersNeeded && styles.disabledButton
          ]}
          onPress={startGameWithTeams}
          disabled={selectedPlayers.length !== totalPlayersNeeded}
        >
          <Text style={styles.startButtonText}>Start Game</Text>
        </TouchableOpacity>
      </View>
      
      {/* Guest Modal */}
      <Modal
        visible={showGuestModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Guest Player</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Player Name (required)"
              value={guestName}
              onChangeText={setGuestName}
              autoFocus
            />
            
            <TextInput
              style={styles.input}
              placeholder="Jersey Number (optional)"
              value={guestJersey}
              onChangeText={setGuestJersey}
              keyboardType="numeric"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowGuestModal(false);
                  setGuestName('');
                  setGuestJersey('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={addGuest}
              >
                <Text style={styles.addButtonText}>Add Player</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131E24',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2B373F',
  },
  title: {
    fontSize: 24,
    fontFamily: FONTS.orbitron.bold,
    marginBottom: 4,
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FONTS.orbitron.regular,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  counter: {
    fontSize: 14,
    fontFamily: FONTS.orbitron.medium,
    color: '#FF6723',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.orbitron.medium,
    marginBottom: 12,
    color: '#fff',
  },
  playerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#37464D',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2B373F',
  },
  selectedPlayer: {
    backgroundColor: 'rgba(255, 103, 35, 0.2)',
    borderWidth: 2,
    borderColor: '#FF6723',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontFamily: FONTS.orbitron.medium,
    marginBottom: 2,
    color: '#fff',
  },
  playerJersey: {
    fontSize: 14,
    fontFamily: FONTS.orbitron.regular,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  checkmark: {
    fontSize: 20,
    fontFamily: FONTS.orbitron.bold,
    color: '#FF6723',
  },
  removeButton: {
    fontSize: 20,
    fontFamily: FONTS.orbitron.bold,
    color: '#ff3b30',
    padding: 4,
  },
  addGuestButton: {
    padding: 16,
    backgroundColor: '#131E24',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2B373F',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addGuestText: {
    fontSize: 16,
    fontFamily: FONTS.orbitron.medium,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#2B373F',
  },
  startButton: {
    backgroundColor: '#FF6723',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 103, 35, 0.3)',
  },
  startButtonText: {
    color: '#131E24',
    fontSize: 18,
    fontFamily: FONTS.orbitron.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#37464D',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#2B373F',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: FONTS.orbitron.bold,
    marginBottom: 20,
    textAlign: 'center',
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#2B373F',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: FONTS.orbitron.regular,
    marginBottom: 16,
    backgroundColor: '#131E24',
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#131E24',
    borderWidth: 1,
    borderColor: '#2B373F',
  },
  cancelButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: FONTS.orbitron.medium,
  },
  addButton: {
    backgroundColor: '#FF6723',
  },
  addButtonText: {
    color: '#131E24',
    fontFamily: FONTS.orbitron.medium,
  },
});