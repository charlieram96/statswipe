import React, { useState } from 'react';
import { LoginScreen } from '../screens/Login';
import { RegisterScreen } from '../screens/Register';
import { ForgotPasswordScreen } from '../screens/ForgotPassword';

type AuthScreen = 'login' | 'register' | 'forgotPassword';

export const AuthNavigator: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>('login');

  switch (currentScreen) {
    case 'login':
      return (
        <LoginScreen
          onNavigateToRegister={() => setCurrentScreen('register')}
          onNavigateToForgotPassword={() => setCurrentScreen('forgotPassword')}
        />
      );
    case 'register':
      return (
        <RegisterScreen
          onNavigateToLogin={() => setCurrentScreen('login')}
        />
      );
    case 'forgotPassword':
      return (
        <ForgotPasswordScreen
          onNavigateToLogin={() => setCurrentScreen('login')}
        />
      );
    default:
      return (
        <LoginScreen
          onNavigateToRegister={() => setCurrentScreen('register')}
          onNavigateToForgotPassword={() => setCurrentScreen('forgotPassword')}
        />
      );
  }
};
