import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';
import * as Font from 'expo-font';
import BasketballIcon from './assets/icons/basketball.svg';
import { useSessionStore } from './stores/sessionStore';
import { loadPendingEvents } from './stores/gameStore';
import { setupAutoSync } from './services/sync';
import { FONTS } from './constants/fonts';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

// Screens
import { HomeScreen } from './screens/Home';
import { SetupScreen } from './screens/Setup';
import { GameScreen } from './screens/Game';
import { HistoryScreen } from './screens/History';
import { ProfileScreen } from './screens/Profile';
import { FriendsScreen } from './screens/Friends';
import { AuthNavigator } from './components/AuthNavigator';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  const { theme } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'My Games') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'NewGame') {
            // Custom center button with basketball icon
            return (
              <View style={{
                alignItems: 'center',
                marginBottom: 0,
              }}>
                <View style={{
                  width: 65,
                  height: 65,
                  borderRadius: 50,               
                  justifyContent: 'center',
                  alignItems: 'center',
                  elevation: 8,
                  shadowColor: '#FF8032',
                  shadowOffset: { width: 5, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                }}>
                  <BasketballIcon width={65} height={65} />
                </View>
                <Text style={{
                  fontSize: 10,
                  fontFamily: FONTS.orbitron.medium,
                  color: theme.tabBarActive,
                  marginTop: 4,
                }}>New Game</Text>
              </View>
            );
          } else if (route.name === 'Friends') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Me') {
            iconName = focused ? 'person' : 'person-outline';
          }

          if (route.name !== 'NewGame') {
            return <Ionicons name={iconName} size={size} color={color} />;
          }
        },
        tabBarActiveTintColor: theme.tabBarActive,
        tabBarInactiveTintColor: theme.tabBarInactive,
        tabBarStyle: {
          backgroundColor: theme.tabBarBackground,
          borderTopColor: theme.tabBarBorder,
          borderTopWidth: 2,
          height: 105,
          paddingBottom: 45,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          fontFamily: FONTS.orbitron.medium,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen 
        name="My Games" 
        component={HistoryScreen}
        options={{
          tabBarItemStyle: { marginLeft: -10 }
        }}
      />
      <Tab.Screen 
        name="NewGame" 
        component={SetupScreen}
        options={{
          tabBarLabel: () => null,
        }}
      />
      <Tab.Screen 
        name="Friends" 
        component={FriendsScreen}
        options={{
          tabBarItemStyle: { marginRight: -10 }
        }}
      />
      <Tab.Screen name="Me" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { initSession, isAuthenticated, loading } = useSessionStore();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'Orbitron-Regular': require('./assets/fonts/Orbitron-Regular.ttf'),
          'Orbitron-Medium': require('./assets/fonts/Orbitron-Medium.ttf'),
          'Orbitron-Bold': require('./assets/fonts/Orbitron-Bold.ttf'),
          'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
          'Inter-Medium': require('./assets/fonts/Inter-Medium.ttf'),
          'Inter-SemiBold': require('./assets/fonts/Inter-SemiBold.ttf'),
          'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
        });
        console.log('Fonts loaded successfully');
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
        setFontsLoaded(true); // Continue even if fonts fail to load
      }
    }

    loadFonts();
    
    // Initialize session
    initSession();
    
    // Load pending events
    loadPendingEvents();
    
    // Setup auto sync (disabled for development)
    // setupAutoSync();
  }, []);

  // Show loading screen while initializing or loading fonts
  if (loading || !fontsLoaded) {
    return (
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.background }}>
        <StatusBar style={theme.background === '#131E24' ? 'light' : 'dark'} />
      </GestureHandlerRootView>
    );
  }

  // Show authentication screens if not authenticated
  if (!isAuthenticated) {
    return (
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.background }}>
        <StatusBar style={theme.background === '#131E24' ? 'light' : 'dark'} />
        <AuthNavigator />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.background }}>
      <NavigationContainer>
        <StatusBar style={theme.background === '#131E24' ? 'light' : 'dark'} />
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.surface,
              borderBottomWidth: 0,
              shadowOpacity: 0,
              elevation: 0,
            },
            headerTintColor: theme.text,
            headerTitleStyle: {
              fontFamily: FONTS.orbitron.bold,
            },
          }}
        >
          {/* Main Tab Navigator */}
          <Stack.Screen 
            name="Return" 
            component={TabNavigator} 
            options={{ headerShown: false }}
          />
          
          
          {/* Game screen as a separate stack screen */}
          <Stack.Screen 
            name="Game" 
            component={GameScreen} 
            options={{ 
              title: 'Game',
              headerLeft: () => null, // Remove back button during game
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}