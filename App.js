import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import AppNavigation from './src/navigation/appNavigation.js';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MenuProvider } from 'react-native-popup-menu';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';


export default function App() {
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '793156853153-4b0ji8gmd0hdkpb6tv1nto1mmfl945e4.apps.googleusercontent.com', // Get this from your Google Cloud Console
      iosClientId: '793156853153-eqkirerhagidvuc0ca5odags17v443os.apps.googleusercontent.com', // Get this from your Google Cloud Console
    });
  // Check if Apple Sign-In is available
  AppleAuthentication.isAvailableAsync().then((isAvailable) => {
    console.log('Apple Sign-In is available:', isAvailable);
    });
  }, []);



  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <MenuProvider>
      <AppNavigation />
      </MenuProvider>
    </GestureHandlerRootView>
  );
}
