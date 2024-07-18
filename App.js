import 'react-native-gesture-handler';

import React, { useEffect } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import AppNavigation from './src/navigation/appNavigation.js';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '793156853153-4b0ji8gmd0hdkpb6tv1nto1mmfl945e4.apps.googleusercontent.com',
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppNavigation />
    </GestureHandlerRootView>
  );
}
