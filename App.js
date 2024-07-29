import 'react-native-gesture-handler';

import React, { useEffect } from 'react';
import AppNavigation from './src/navigation/appNavigation.js';
import { GestureHandlerRootView } from 'react-native-gesture-handler';


export default function App() {
  useEffect(() => {  
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppNavigation />
    </GestureHandlerRootView>
  );
}
