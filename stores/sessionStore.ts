import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateHooperCode } from '../utils/hooperCode';

interface GuestUser {
  id: string;
  displayName: string;
  hooperCode: string;
  isGuest: true;
}

interface SessionState {
  session: Session | null;
  user: User | null;
  guestUser: GuestUser | null;
  profile: { hooper_code: string; display_name: string; username: string } | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: { full_name: string; username: string }) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: (displayName: string) => Promise<void>;
  clearError: () => void;
  initSession: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  user: null,
  guestUser: null,
  profile: null,
  loading: true,
  error: null,
  isAuthenticated: false,

  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      set({ 
        session: data.session, 
        user: data.session?.user || null,
        isAuthenticated: !!data.session,
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Sign in failed',
        loading: false 
      });
      throw error;
    }
  },

  signUp: async (email: string, password: string, metadata?: { full_name: string; username: string }) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata ? {
            full_name: metadata.full_name,
            display_name: metadata.full_name,
            username: metadata.username
          } : undefined
        }
      });
      
      if (error) throw error;
      
      set({ 
        session: data.session, 
        user: data.session?.user || null,
        isAuthenticated: !!data.session,
        loading: false 
      });
      
      // Fetch profile if authenticated
      if (data.session?.user) {
        get().fetchProfile();
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Sign up failed',
        loading: false 
      });
      throw error;
    }
  },

  signOut: async () => {
    try {
      set({ loading: true, error: null });
      
      // Check if guest user
      const { guestUser } = get();
      if (guestUser) {
        await AsyncStorage.removeItem('guestUser');
        set({ 
          guestUser: null,
          isAuthenticated: false, 
          loading: false 
        });
        return;
      }
      
      // Sign out authenticated user
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      set({ 
        session: null, 
        user: null,
        profile: null,
        isAuthenticated: false, 
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Sign out failed',
        loading: false 
      });
      throw error;
    }
  },

  resetPassword: async (email: string) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://your-app-url.com/reset-password',
      });
      
      if (error) throw error;
      
      set({ loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Password reset failed',
        loading: false 
      });
      throw error;
    }
  },

  signInWithApple: async () => {
    try {
      set({ loading: true, error: null });
      
      if (Platform.OS !== 'ios') {
        throw new Error('Apple Sign In is only available on iOS');
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        ],
      });

      if (credential.identityToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
          nonce: credential.authorizationCode ? 
            await Crypto.digestStringAsync(
              Crypto.CryptoDigestAlgorithm.SHA256,
              credential.authorizationCode
            ) : undefined,
        });

        if (error) throw error;

        set({ 
          session: data.session, 
          user: data.session?.user || null,
          isAuthenticated: !!data.session,
          loading: false 
        });
      }
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        set({ loading: false });
      } else {
        set({ 
          error: error instanceof Error ? error.message : 'Apple Sign In failed',
          loading: false 
        });
        throw error;
      }
    }
  },

  signInWithGoogle: async () => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          skipBrowserRedirect: Platform.OS !== 'web',
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Open the browser for OAuth flow
        const result = await WebBrowser.openAuthSessionAsync(data.url);

        if (result.type === 'success' && result.url) {
          // Extract the URL fragment containing tokens
          const url = new URL(result.url);
          const params = new URLSearchParams(url.hash.substring(1));
          
          // Get tokens from the URL
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');
          
          if (access_token) {
            // Set the session with the tokens
            const { data: sessionData, error: sessionError } = 
              await supabase.auth.setSession({
                access_token,
                refresh_token: refresh_token || '',
              });

            if (sessionError) throw sessionError;

            set({ 
              session: sessionData.session, 
              user: sessionData.session?.user || null,
              isAuthenticated: !!sessionData.session,
              loading: false 
            });
          } else {
            throw new Error('No access token received');
          }
        } else if (result.type === 'cancel') {
          set({ loading: false });
        }
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Google Sign In failed',
        loading: false 
      });
      throw error;
    }
  },

  signInAsGuest: async (displayName: string) => {
    try {
      set({ loading: true, error: null });
      
      // Generate a unique hooper code for the guest
      const hooperCode = generateHooperCode();
      const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      
      const guestUser: GuestUser = {
        id: guestId,
        displayName,
        hooperCode,
        isGuest: true,
      };
      
      // Store guest user in AsyncStorage
      await AsyncStorage.setItem('guestUser', JSON.stringify(guestUser));
      
      set({ 
        guestUser,
        isAuthenticated: true,
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Guest sign in failed',
        loading: false 
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('hooper_code, display_name, username')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      
      set({ profile: data });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  },

  initSession: async () => {
    try {
      set({ loading: true, error: null });
      
      // Check for guest user first
      const guestUserStr = await AsyncStorage.getItem('guestUser');
      if (guestUserStr) {
        const guestUser = JSON.parse(guestUserStr) as GuestUser;
        set({ 
          guestUser,
          isAuthenticated: true,
          loading: false 
        });
        return;
      }
      
      // Check for authenticated user
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      set({ 
        session, 
        user: session?.user || null, 
        isAuthenticated: !!session,
        loading: false 
      });
      
      // Fetch profile if authenticated
      if (session?.user) {
        get().fetchProfile();
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, session) => {
        set({ 
          session, 
          user: session?.user || null,
          isAuthenticated: !!session 
        });
        
        if (session?.user) {
          get().fetchProfile();
        }
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to initialize session',
        loading: false 
      });
    }
  },
}));