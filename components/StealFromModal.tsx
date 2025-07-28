import React from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  StyleSheet,
  ScrollView,
} from 'react-native';
import { GamePlayer, Player } from '../lib/supabase';
import { FONTS } from '../constants/fonts';

interface StealFromModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPlayer: (gamePlayerId: string) => void;
  onSelectTeam: () => void;
  oppositeTeamPlayers: GamePlayer[];
  allPlayers: { [key: string]: Player };
}

export const StealFromModal: React.FC<StealFromModalProps> = ({
  visible,
  onClose,
  onSelectPlayer,
  onSelectTeam,
  oppositeTeamPlayers,
  allPlayers,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Who was the ball stolen from?</Text>
          
          <ScrollView style={styles.playerList} showsVerticalScrollIndicator={false}>
            {oppositeTeamPlayers.map((gamePlayer) => {
              if (!gamePlayer || !gamePlayer.id) return null;
              const player = allPlayers[gamePlayer.player_id];
              return (
                <TouchableOpacity
                  key={gamePlayer.id}
                  style={styles.playerOption}
                  onPress={() => onSelectPlayer(gamePlayer.id)}
                >
                  <Text style={styles.playerOptionText}>
                    {player?.name || 'Unknown'} 
                    {player?.jersey_num && ` (#${player.jersey_num})`}
                  </Text>
                  <Text style={styles.teamIndicator}>
                    Team {gamePlayer.team}
                  </Text>
                </TouchableOpacity>
              );
            })}
            
            {/* Team option */}
            <TouchableOpacity
              style={[styles.playerOption, styles.teamOption]}
              onPress={onSelectTeam}
            >
              <Text style={styles.playerOptionText}>Team</Text>
              <Text style={styles.teamIndicator}>General turnover</Text>
            </TouchableOpacity>
          </ScrollView>
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    maxHeight: '70%',
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
  playerList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  playerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2B373F',
  },
  teamOption: {
    backgroundColor: 'rgba(255, 103, 35, 0.1)',
    borderRadius: 8,
    marginTop: 8,
    borderBottomWidth: 0,
  },
  playerOptionText: {
    fontSize: 16,
    fontFamily: FONTS.orbitron.medium,
    flex: 1,
    color: '#fff',
  },
  teamIndicator: {
    fontSize: 12,
    fontFamily: FONTS.orbitron.regular,
    color: 'rgba(255, 255, 255, 0.7)',
    backgroundColor: '#131E24',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  cancelButton: {
    paddingVertical: 12,
    backgroundColor: '#37464D',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2B373F',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: FONTS.orbitron.medium,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});