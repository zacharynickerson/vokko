import 'react-native-gesture-handler';

import React, { useEffect } from 'react';
import AppNavigation from './src/navigation/appNavigation.js';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MenuProvider } from 'react-native-popup-menu';


export default function App() {
  useEffect(() => {  
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <MenuProvider>
      <AppNavigation />
      </MenuProvider>
    </GestureHandlerRootView>
  );
}
