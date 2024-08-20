import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { AppState, Alert } from 'react-native';
import AppNavigation from './src/navigation/appNavigation.js';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MenuProvider } from 'react-native-popup-menu';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import { voiceNoteSync } from './src/utilities/VoiceNoteSync';
import { auth } from './config/firebase';

export default function App() {
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '793156853153-4b0ji8gmd0hdkpb6tv1nto1mmfl945e4.apps.googleusercontent.com',
      iosClientId: '793156853153-eqkirerhagidvuc0ca5odags17v443os.apps.googleusercontent.com',
    });

    AppleAuthentication.isAvailableAsync().then((isAvailable) => {
      console.log('Apple Sign-In is available:', isAvailable);
    });

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    syncIfAuthenticated();

    return () => {
      subscription.remove();
    };
  }, []);

  const handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'active') {
      syncIfAuthenticated();
    }
  };

  const syncIfAuthenticated = async () => {
    const user = auth.currentUser;
    if (user && !isSyncing) {
      setIsSyncing(true);
      try {
        console.log('Starting sync...');
        await voiceNoteSync.syncVoiceNotes();
        console.log('Sync completed successfully');
      } catch (error) {
        console.error('Sync failed:', error);
        console.error('Error stack:', error.stack);
        Alert.alert(
          'Sync Error',
          'Failed to sync voice notes. Please try again later.',
          [{ text: 'OK' }]
        );
      } finally {
        setIsSyncing(false);
      }
    } else {
      console.log('Sync skipped. User:', user ? 'Authenticated' : 'Not authenticated', 'isSyncing:', isSyncing);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <MenuProvider>
        <AppNavigation />
      </MenuProvider>
    </GestureHandlerRootView>
  );
}