import 'react-native-gesture-handler';

import React, { useEffect } from 'react';

import AppNavigation from '/Users/zacharynickerson/VokkoApp/src/navigation/appNavigation.js';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { apiCall } from '/Users/zacharynickerson/VokkoApp/src/api/openAI.js';

export default function App() {
  useEffect(() => {

  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppNavigation />
    </GestureHandlerRootView>
  );
}
