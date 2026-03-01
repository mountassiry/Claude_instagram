import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { IdentityProvider } from './src/contexts/IdentityContext';
import { MessagingProvider } from './src/contexts/MessagingContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <IdentityProvider>
        <MessagingProvider>
          <StatusBar style="auto" />
          <AppNavigator />
        </MessagingProvider>
      </IdentityProvider>
    </SafeAreaProvider>
  );
}
