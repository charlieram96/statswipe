import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../stores/gameStore';
import { useBasketballSessionStore } from '../stores/basketballSessionStore';
import { GamePlayer, supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import { FONTS } from '../constants/fonts';
import { isValidHooperCode } from '../utils/hooperCode';

const modes = [
  { value: 1, label: '1v1' },
  { value: 2, label: '2v2' },
  { value: 3, label: '3v3' },
  { value: 4, label: '4v4' },
  { value: 5, label: '5v5' },
] as const;

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

export const SetupScreen: React.FC = () => {
  const navigation = useNavigation();
  const { mode, setMode, setTeams, startGame } = useGameStore();
  const { currentSession, isInSession, createSession, sessionGames, addGameToSession } = useBasketballSessionStore();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  // Mode selection state
  const [selectedMode, setSelectedMode] = useState<1 | 2 | 3 | 4 | 5 | null>(mode);
  
  // Team setup state
  const [teamAPlayers, setTeamAPlayers] = useState<(MockPlayer | null)[]>([]);
  const [teamBPlayers, setTeamBPlayers] = useState<(MockPlayer | null)[]>([]);
  const [teamAName, setTeamAName] = useState('Team 1');
  const [teamBName, setTeamBName] = useState('Team 2');
  
  // Modal states
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<'A' | 'B' | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestJersey, setGuestJersey] = useState('');
  const [showTeamNameModal, setShowTeamNameModal] = useState(false);
  const [editingTeamName, setEditingTeamName] = useState<'A' | 'B' | null>(null);
  const [tempTeamName, setTempTeamName] = useState('');
  const [searchResults, setSearchResults] = useState<MockPlayer[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounce database search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchDatabase(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleModeSelect = (modeValue: 1 | 2 | 3 | 4 | 5) => {
    setSelectedMode(modeValue);
    setMode(modeValue);
    // Initialize team arrays with null values
    const emptyTeam = Array(modeValue).fill(null);
    setTeamAPlayers(emptyTeam);
    setTeamBPlayers(emptyTeam);
    // Reset team names when mode changes
    setTeamAName('Team 1');
    setTeamBName('Team 2');
  };

  const openTeamNameEditor = (team: 'A' | 'B') => {
    setEditingTeamName(team);
    setTempTeamName(team === 'A' ? teamAName : teamBName);
    setShowTeamNameModal(true);
  };

  const saveTeamName = () => {
    if (!editingTeamName || !tempTeamName.trim()) return;
    
    if (editingTeamName === 'A') {
      setTeamAName(tempTeamName.trim());
    } else {
      setTeamBName(tempTeamName.trim());
    }
    
    setShowTeamNameModal(false);
    setEditingTeamName(null);
    setTempTeamName('');
  };

  const openPlayerSelection = (team: 'A' | 'B', position: number) => {
    setSelectedTeam(team);
    setSelectedPosition(position);
    setSearchQuery('');
    setSearchResults([]);
    setShowPlayerModal(true);
  };

  const searchDatabase = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const searchTerm = query.trim();
      const cleanCode = searchTerm.replace(/[-\s]/g, '').toUpperCase();
      const isHooperCode = isValidHooperCode(cleanCode);

      let data = null;
      let error = null;

      if (isHooperCode) {
        // Search by hooper code
        const result = await supabase
          .from('profiles')
          .select('id, hooper_code, display_name, username')
          .eq('hooper_code', cleanCode)
          .limit(10);
        data = result.data;
        error = result.error;
      } else {
        // Search by username (case insensitive)
        const result = await supabase
          .from('profiles')
          .select('id, hooper_code, display_name, username')
          .ilike('username', `%${searchTerm}%`)
          .limit(10);
        data = result.data;
        error = result.error;
      }

      if (!error && data) {
        // Convert to MockPlayer format
        const players: MockPlayer[] = data.map(profile => ({
          id: profile.id,
          name: profile.display_name || profile.username || 'Unknown',
          jersey_num: profile.hooper_code,
          is_guest: false,
        }));
        setSearchResults(players);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Database search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectPlayer = (player: MockPlayer) => {
    if (!selectedTeam) return;
    
    // Check if player is already selected in either team
    const isInTeamA = teamAPlayers.some(p => p?.id === player.id);
    const isInTeamB = teamBPlayers.some(p => p?.id === player.id);
    
    if (isInTeamA || isInTeamB) {
      Alert.alert('Player Already Selected', 'This player is already on a team');
      return;
    }

    if (selectedTeam === 'A') {
      const newTeamA = [...teamAPlayers];
      newTeamA[selectedPosition] = player;
      setTeamAPlayers(newTeamA);
    } else {
      const newTeamB = [...teamBPlayers];
      newTeamB[selectedPosition] = player;
      setTeamBPlayers(newTeamB);
    }
    
    setShowPlayerModal(false);
  };

  const removePlayer = (team: 'A' | 'B', position: number) => {
    if (team === 'A') {
      const newTeamA = [...teamAPlayers];
      newTeamA[position] = null;
      setTeamAPlayers(newTeamA);
    } else {
      const newTeamB = [...teamBPlayers];
      newTeamB[position] = null;
      setTeamBPlayers(newTeamB);
    }
  };

  const addGuest = () => {
    if (!guestName.trim()) {
      Alert.alert('Error', 'Guest name is required');
      return;
    }

    const newGuest: MockPlayer = {
      id: `guest_${Date.now()}`,
      name: guestName.trim(),
      jersey_num: guestJersey.trim() || undefined,
      is_guest: true,
    };

    selectPlayer(newGuest);
    setGuestName('');
    setGuestJersey('');
    setShowGuestModal(false);
  };

  const filteredFriends = mockFriends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.jersey_num?.includes(searchQuery)
  );

  // Combine friends and search results, removing duplicates
  const allAvailablePlayers = [
    ...filteredFriends,
    ...searchResults.filter(searchPlayer => 
      !mockFriends.some(friend => friend.id === searchPlayer.id)
    )
  ];

  const startGameWithTeams = () => {
    if (!selectedMode) {
      Alert.alert('Select Mode', 'Please select a game mode first');
      return;
    }
    
    const teamAComplete = teamAPlayers.every(player => player !== null);
    const teamBComplete = teamBPlayers.every(player => player !== null);
    
    if (!teamAComplete || !teamBComplete) {
      Alert.alert('Incomplete Teams', 'Please fill all positions for both teams');
      return;
    }
    
    // Create a new session if not in one
    let sessionId = currentSession?.id;
    if (!isInSession) {
      const session = createSession();
      sessionId = session.id;
    }
    
    // Calculate game number
    const gameNumber = sessionGames.length + 1;
    const gameId = `game_${sessionId}_${gameNumber}`;
    
    // Convert to GamePlayer format
    const teamA: GamePlayer[] = teamAPlayers.map((player, index) => ({
      id: `game_player_a_${index}`,
      game_id: gameId,
      player_id: player!.id,
      team: 'A' as const,
    }));
    
    const teamB: GamePlayer[] = teamBPlayers.map((player, index) => ({
      id: `game_player_b_${index}`,
      game_id: gameId,
      player_id: player!.id,
      team: 'B' as const,
    }));
    
    setTeams(teamA, teamB);
    startGame(gameId, sessionId!, gameNumber);
    addGameToSession(gameId);
    (navigation as any).navigate('Game');
  };

  const canStartGame = selectedMode && 
    teamAPlayers.every(player => player !== null) && 
    teamBPlayers.every(player => player !== null);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Session Indicator */}
        {isInSession && currentSession && (
          <View style={styles.sessionIndicator}>
            <Text style={styles.sessionLabel}>Active Session</Text>
            <Text style={styles.sessionName}>{currentSession.name}</Text>
            <Text style={styles.sessionInfo}>Game #{sessionGames.length + 1}</Text>
          </View>
        )}

        {/* Mode Selection Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Game Mode</Text>
          <Text style={styles.sectionSubtitle}>Choose the number of players per team</Text>
          
          <View style={styles.modesContainer}>
            {modes.map((mode) => (
              <Pressable
                key={mode.value}
                style={({ pressed }) => [
                  styles.modeButton,
                  selectedMode === mode.value && styles.selectedModeButton,
                  pressed && styles.modeButtonPressed
                ]}
                onPress={() => handleModeSelect(mode.value)}
              >
                <Text style={[
                  styles.modeLabel,
                  selectedMode === mode.value && styles.selectedModeLabel
                ]}>
                  {mode.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Team Setup Section */}
        {selectedMode && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Setup Teams</Text>
            <Text style={styles.sectionSubtitle}>
              Select players for each team position
            </Text>
            
            <View style={styles.teamsContainer}>
              {/* Team A Column */}
              <View style={styles.teamColumn}>
                <TouchableOpacity 
                  style={styles.teamTitleContainer}
                  onPress={() => openTeamNameEditor('A')}
                >
                  <Text style={styles.teamTitle}>{teamAName}</Text>
                  <Ionicons name="pencil" size={16} color={theme.primary} />
                </TouchableOpacity>
                {teamAPlayers.map((player, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.playerSlot}
                    onPress={() => openPlayerSelection('A', index)}
                  >
                    {player ? (
                      <View style={styles.selectedPlayerInfo}>
                        <View style={styles.playerDetails}>
                          <Text style={styles.selectedPlayerName}>{player.name}</Text>
                          <Text style={styles.selectedPlayerJersey}>
                            #{player.jersey_num || '--'}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => removePlayer('A', index)}
                          style={styles.removePlayerButton}
                        >
                          <Ionicons name="close" size={16} color="#ff3b30" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.emptySlot}>
                        <Ionicons name="add" size={20} color={theme.textSecondary} />
                        <Text style={styles.emptySlotText}>Select Player</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Team B Column */}
              <View style={styles.teamColumn}>
                <TouchableOpacity 
                  style={styles.teamTitleContainer}
                  onPress={() => openTeamNameEditor('B')}
                >
                  <Text style={styles.teamTitle}>{teamBName}</Text>
                  <Ionicons name="pencil" size={16} color={theme.primary} />
                </TouchableOpacity>
                {teamBPlayers.map((player, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.playerSlot}
                    onPress={() => openPlayerSelection('B', index)}
                  >
                    {player ? (
                      <View style={styles.selectedPlayerInfo}>
                        <View style={styles.playerDetails}>
                          <Text style={styles.selectedPlayerName}>{player.name}</Text>
                          <Text style={styles.selectedPlayerJersey}>
                            #{player.jersey_num || '--'}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => removePlayer('B', index)}
                          style={styles.removePlayerButton}
                        >
                          <Ionicons name="close" size={16} color="#ff3b30" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.emptySlot}>
                        <Ionicons name="add" size={20} color={theme.textSecondary} />
                        <Text style={styles.emptySlotText}>Select Player</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Start Game Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.startButton,
            !canStartGame && styles.disabledButton
          ]}
          onPress={startGameWithTeams}
          disabled={!canStartGame}
        >
          <Text style={styles.startButtonText}>Start Game</Text>
        </TouchableOpacity>
      </View>

      {/* Player Selection Modal */}
      <Modal
        visible={showPlayerModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select Player for {selectedTeam === 'A' ? teamAName : teamBName}
              </Text>
              <TouchableOpacity
                onPress={() => setShowPlayerModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.searchInput}
              placeholder="Search friends, hooper code, or username"
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <ScrollView style={styles.playersList}>
              {/* Loading indicator */}
              {isSearching && (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Searching...</Text>
                </View>
              )}

              {/* Friends section */}
              {filteredFriends.length > 0 && (
                <>
                  <Text style={styles.playersListTitle}>Friends</Text>
                  {filteredFriends.map((player) => {
                    const isSelected = teamAPlayers.some(p => p?.id === player.id) || 
                                     teamBPlayers.some(p => p?.id === player.id);
                    
                    return (
                      <TouchableOpacity
                        key={player.id}
                        style={[styles.playerOption, isSelected && styles.disabledPlayerOption]}
                        onPress={() => selectPlayer(player)}
                        disabled={isSelected}
                      >
                        <View style={styles.playerOptionInfo}>
                          <Text style={[
                            styles.playerOptionName,
                            isSelected && styles.disabledPlayerText
                          ]}>
                            {player.name}
                          </Text>
                          <Text style={[
                            styles.playerOptionJersey,
                            isSelected && styles.disabledPlayerText
                          ]}>
                            #{player.jersey_num}
                          </Text>
                        </View>
                        {isSelected && (
                          <Text style={styles.selectedBadge}>Selected</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}

              {/* Search results section */}
              {searchResults.length > 0 && (
                <>
                  <Text style={styles.playersListTitle}>
                    {filteredFriends.length > 0 ? 'Other Players' : 'Search Results'}
                  </Text>
                  {searchResults.filter(searchPlayer => 
                    !mockFriends.some(friend => friend.id === searchPlayer.id)
                  ).map((player) => {
                    const isSelected = teamAPlayers.some(p => p?.id === player.id) || 
                                     teamBPlayers.some(p => p?.id === player.id);
                    
                    return (
                      <TouchableOpacity
                        key={player.id}
                        style={[styles.playerOption, isSelected && styles.disabledPlayerOption]}
                        onPress={() => selectPlayer(player)}
                        disabled={isSelected}
                      >
                        <View style={styles.playerOptionInfo}>
                          <Text style={[
                            styles.playerOptionName,
                            isSelected && styles.disabledPlayerText
                          ]}>
                            {player.name}
                          </Text>
                          <Text style={[
                            styles.playerOptionJersey,
                            isSelected && styles.disabledPlayerText
                          ]}>
                            {player.jersey_num}
                          </Text>
                        </View>
                        {isSelected && (
                          <Text style={styles.selectedBadge}>Selected</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}

              {/* No results message */}
              {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && filteredFriends.length === 0 && (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>No players found</Text>
                  <Text style={styles.noResultsSubtext}>
                    Try searching by hooper code or username
                  </Text>
                </View>
              )}
              
              <TouchableOpacity
                style={styles.addGuestOption}
                onPress={() => {
                  setShowPlayerModal(false);
                  setShowGuestModal(true);
                }}
              >
                <Ionicons name="person-add" size={20} color={theme.primary} />
                <Text style={styles.addGuestOptionText}>Add Guest Player</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
              placeholderTextColor={theme.textSecondary}
              value={guestName}
              onChangeText={setGuestName}
              autoFocus
            />
            
            <TextInput
              style={styles.input}
              placeholder="Jersey Number (optional)"
              placeholderTextColor={theme.textSecondary}
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
                  setShowPlayerModal(true);
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

      {/* Team Name Edit Modal */}
      <Modal
        visible={showTeamNameModal}
        transparent
        animationType="none"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Team Name</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Enter team name"
              placeholderTextColor={theme.textSecondary}
              value={tempTeamName}
              onChangeText={setTempTeamName}
              autoFocus
              selectTextOnFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowTeamNameModal(false);
                  setEditingTeamName(null);
                  setTempTeamName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={saveTeamName}
                disabled={!tempTeamName.trim()}
              >
                <Text style={styles.addButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: FONTS.orbitron.bold,
    color: theme.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontFamily: FONTS.inter.regular,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  modesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  modeButton: {
    width: 100,
    height: 50,
    backgroundColor: '#37464D',
    borderRadius: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedModeButton: {
    backgroundColor: '#FF6723',
    boxShadow: '0px 5px 0px 0px rgb(204, 82, 28)',
  },
  modeButtonPressed: {
    transform: [{ translateY: 5 }],
    boxShadow: 'none',
  },
  modeLabel: {
    fontSize: 16,
    fontFamily: FONTS.orbitron.bold,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 2,
  },
  selectedModeLabel: {
    color: '#ffffff',
  },
  teamsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  teamColumn: {
    flex: 1,
  },
  teamTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 8,
  },
  teamTitle: {
    fontSize: 20,
    fontFamily: FONTS.orbitron.bold,
    color: theme.text,
  },
  playerSlot: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
    minHeight: 60,
  },
  selectedPlayerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerDetails: {
    flex: 1,
  },
  selectedPlayerName: {
    fontSize: 16,
    fontFamily: FONTS.orbitron.medium,
    color: theme.text,
    marginBottom: 2,
  },
  selectedPlayerJersey: {
    fontSize: 14,
    fontFamily: FONTS.inter.regular,
    color: theme.textSecondary,
  },
  removePlayerButton: {
    padding: 4,
  },
  emptySlot: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 28,
  },
  emptySlotText: {
    fontSize: 14,
    fontFamily: FONTS.inter.regular,
    color: theme.textSecondary,
    marginTop: 4,
  },
  footer: {
    padding: 20,
  },
  startButton: {
    backgroundColor: theme.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: theme.textSecondary,
    opacity: 0.5,
  },
  startButtonText: {
    color: theme.background,
    fontSize: 18,
    fontFamily: FONTS.orbitron.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: theme.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: FONTS.orbitron.bold,
    color: theme.text,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  searchInput: {
    backgroundColor: theme.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: FONTS.inter.regular,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 20,
  },
  playersList: {
    maxHeight: 300,
  },
  playersListTitle: {
    fontSize: 16,
    fontFamily: FONTS.orbitron.medium,
    color: theme.text,
    marginBottom: 12,
  },
  playerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.background,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  disabledPlayerOption: {
    opacity: 0.5,
  },
  playerOptionInfo: {
    flex: 1,
  },
  playerOptionName: {
    fontSize: 16,
    fontFamily: FONTS.orbitron.medium,
    color: theme.text,
    marginBottom: 2,
  },
  playerOptionJersey: {
    fontSize: 14,
    fontFamily: FONTS.inter.regular,
    color: theme.textSecondary,
  },
  disabledPlayerText: {
    color: theme.textSecondary,
    opacity: 0.7,
  },
  selectedBadge: {
    fontSize: 12,
    fontFamily: FONTS.orbitron.medium,
    color: theme.primary,
  },
  addGuestOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.background,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.primary,
    borderStyle: 'dashed',
    marginTop: 8,
    gap: 12,
  },
  addGuestOptionText: {
    fontSize: 16,
    fontFamily: FONTS.orbitron.medium,
    color: theme.primary,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: FONTS.inter.regular,
    color: theme.textSecondary,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noResultsText: {
    fontSize: 16,
    fontFamily: FONTS.orbitron.medium,
    color: theme.text,
    marginBottom: 4,
  },
  noResultsSubtext: {
    fontSize: 14,
    fontFamily: FONTS.inter.regular,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  input: {
    backgroundColor: theme.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: FONTS.inter.regular,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cancelButtonText: {
    color: theme.textSecondary,
    fontFamily: FONTS.inter.medium,
  },
  addButton: {
    backgroundColor: theme.primary,
  },
  addButtonText: {
    color: theme.background,
    fontFamily: FONTS.inter.medium,
  },
  sessionIndicator: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  sessionLabel: {
    fontSize: 12,
    fontFamily: FONTS.inter.regular,
    color: theme.background,
    opacity: 0.8,
  },
  sessionName: {
    fontSize: 18,
    fontFamily: FONTS.orbitron.bold,
    color: theme.background,
    marginTop: 4,
  },
  sessionInfo: {
    fontSize: 14,
    fontFamily: FONTS.inter.medium,
    color: theme.background,
    marginTop: 2,
  },
});