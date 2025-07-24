import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  Alert, 
  ScrollView,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSessionStore } from '../stores/sessionStore';
import { useTheme } from '../contexts/ThemeContext';
import { FONTS } from '../constants/fonts';
import { ThemeColors } from '../constants/themes';

export const ProfileScreen: React.FC = () => {
  const { user, guestUser, profile, signOut, loading } = useSessionStore();
  const { theme, themeName, toggleTheme } = useTheme();
  const styles = createStyles(theme);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedName, setEditedName] = useState(profile?.display_name || '');

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.log('Logout error:', error);
            }
          }
        },
      ]
    );
  };

  const handleSaveName = () => {
    // In a real app, this would update the profile in the database
    Alert.alert('Success', 'Name updated successfully');
    setShowEditModal(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Me</Text>
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleLogout}
          disabled={loading}
        >
          <Ionicons name="log-out-outline" size={20} color={theme.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileSection}>
          {guestUser ? (
            <>
              <Text style={styles.name}>{guestUser.displayName}</Text>
              <Text style={styles.guestLabel}>Guest User</Text>
            </>
          ) : (
            <>
              {profile?.display_name && (
                <View style={styles.nameContainer}>
                  <Text style={styles.name}>{profile.display_name}</Text>
                  <TouchableOpacity 
                    onPress={() => {
                      setEditedName(profile.display_name);
                      setShowEditModal(true);
                    }}
                    style={styles.editButton}
                  >
                    <Ionicons name="pencil" size={20} color={theme.primary} />
                  </TouchableOpacity>
                </View>
              )}
              {profile?.username && (
                <Text style={styles.username}>@{profile.username}</Text>
              )}
              {user?.email && (
                <Text style={styles.email}>{user.email}</Text>
              )}
            </>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.themeToggleCard}>
            <View style={styles.themeToggleContent}>
              <Ionicons 
                name={themeName === 'dark' ? 'moon' : 'sunny'} 
                size={20} 
                color={theme.text} 
              />
              <Text style={styles.themeToggleText}>
                {themeName === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </Text>
            </View>
            <Switch
              value={themeName === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ 
                false: theme.border, 
                true: theme.primary 
              }}
              thumbColor={theme.background}
              ios_backgroundColor={theme.border}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          {!guestUser && (
            <>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Full Name</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoValue}>{profile?.display_name || 'Not set'}</Text>
                  <TouchableOpacity 
                    onPress={() => {
                      setEditedName(profile?.display_name || '');
                      setShowEditModal(true);
                    }}
                  >
                    <Ionicons name="create-outline" size={24} color={theme.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Username</Text>
                <Text style={styles.infoValue}>@{profile?.username || 'Not set'}</Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user?.email || 'Not available'}</Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Hooper Code</Text>
                <Text style={styles.hooperCode}>{profile?.hooper_code || 'Not available'}</Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Account Created</Text>
                <Text style={styles.infoValue}>
                  {user?.created_at 
                    ? new Date(user.created_at).toLocaleDateString() 
                    : 'Not available'
                  }
                </Text>
              </View>
            </>
          )}

          {guestUser && (
            <>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Guest Session</Text>
                <Text style={styles.infoValue}>Your data is temporary and will be lost when you sign out</Text>
              </View>
              
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Hooper Code</Text>
                <Text style={styles.hooperCode}>{guestUser.hooperCode}</Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Stats</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Games</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>0%</Text>
              <Text style={styles.statLabel}>Win Rate</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Edit Name Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="none"
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Full Name</Text>
            
            <TextInput
              style={styles.input}
              value={editedName}
              onChangeText={setEditedName}
              placeholder="Enter your full name"
              placeholderTextColor={theme.textSecondary}
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveName}
                disabled={!editedName.trim()}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (theme: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontFamily: FONTS.orbitron.bold,
    color: theme.text,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: theme.background,
  },
  signOutText: {
    fontSize: 14,
    fontFamily: FONTS.inter.medium,
    color: theme.error,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 10,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 24,
    fontFamily: FONTS.orbitron.bold,
    color: theme.text,
  },
  editButton: {
    padding: 8,
  },
  username: {
    fontSize: 16,
    fontFamily: FONTS.inter.regular,
    color: theme.textSecondary,
    marginTop: 4,
  },
  email: {
    fontSize: 14,
    fontFamily: FONTS.inter.medium,
    color: theme.primary,
    marginTop: 4,
  },
  guestLabel: {
    fontSize: 14,
    fontFamily: FONTS.inter.regular,
    color: theme.textTertiary,
    marginTop: 4,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: FONTS.orbitron.medium,
    color: theme.text,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: FONTS.inter.regular,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: FONTS.inter.medium,
    color: theme.text,
  },
  hooperCode: {
    fontSize: 18,
    fontFamily: FONTS.orbitron.bold,
    color: theme.primary,
    letterSpacing: 1,
  },
  themeToggleCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  themeToggleText: {
    fontSize: 16,
    fontFamily: FONTS.inter.medium,
    color: theme.text,
    marginLeft: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  statValue: {
    fontSize: 24,
    fontFamily: FONTS.orbitron.bold,
    color: theme.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: FONTS.inter.regular,
    color: theme.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: FONTS.orbitron.bold,
    color: theme.text,
    marginBottom: 20,
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
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
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
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: theme.primary,
  },
  saveButtonText: {
    color: theme.background,
    fontFamily: FONTS.inter.medium,
    fontSize: 16,
  },
});