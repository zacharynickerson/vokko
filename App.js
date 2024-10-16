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
import { onAuthStateChanged } from 'firebase/auth';
import { registerGlobals } from '@livekit/react-native';
import * as Font from 'expo-font';

registerGlobals();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'DMSans': require('/Users/zacharynickerson/Desktop/vokko/assets/fonts/DMSans-VariableFont_opsz,wght.ttf'),
        'DMSans-Italic': require('/Users/zacharynickerson/Desktop/vokko/assets/fonts/DMSans-Italic-VariableFont_opsz,wght.ttf'),
      });
      setFontsLoaded(true);
    }
    loadFonts();

    GoogleSignin.configure({
      webClientId: '793156853153-4b0ji8gmd0hdkpb6tv1nto1mmfl945e4.apps.googleusercontent.com',
      iosClientId: '793156853153-eqkirerhagidvuc0ca5odags17v443os.apps.googleusercontent.com',
    });

    AppleAuthentication.isAvailableAsync().then((isAvailable) => {
      console.log('Apple Sign-In is available:', isAvailable);
    });

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        syncIfAuthenticated();
      }
    });

    return () => {
      subscription.remove();
      unsubscribe();
    };
  }, []);

  const handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'active') {
      syncIfAuthenticated();
    }
  };

  const syncIfAuthenticated = async () => {
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

  if (!fontsLoaded) {
    return null; // or a loading indicator
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <MenuProvider>
        <AppNavigation />
      </MenuProvider>
    </GestureHandlerRootView>
  );
}
