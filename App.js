import 'react-native-gesture-handler';
import React, { useEffect, useRef, useState } from 'react';
import { AppState, Alert, Platform } from 'react-native';
import AppNavigation from './src/navigation/appNavigation.js';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MenuProvider } from 'react-native-popup-menu';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import { auth } from './config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { registerGlobals } from '@livekit/react-native-webrtc';
import * as Font from 'expo-font';
import * as Notifications from 'expo-notifications';
import { NavigationContainer } from '@react-navigation/native';

registerGlobals();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [user, setUser] = useState(null);
  const navigationRef = useRef();
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'DMSans': require('./assets/fonts/DMSans-VariableFont_opsz,wght.ttf'),
        'DMSans-Italic': require('./assets/fonts/DMSans-Italic-VariableFont_opsz,wght.ttf'),
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
    });

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        priority: Notifications.AndroidNotificationPriority.MAX,
      }),
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const { data: sessionData } = response.notification.request.content;
      if (navigationRef.current) {
        navigationRef.current.navigate('CallStack', {
          screen: 'IncomingCall',
          params: { sessionData }
        });
      }
    });

    const setupNotifications = async () => {
      const currentStatus = await checkNotificationPermissions();
      if (currentStatus !== 'granted') {
        await requestNotificationPermissions();
      }
    };

    setupNotifications();

    // testImmediateNotification();

    return () => {
      subscription.remove();
      unsubscribe();
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  const handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'active') {
      // Removed syncIfAuthenticated call
    }
  };

  const checkNotificationPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    console.log('Current notification permission status:', status);
    return status;
  };

  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    console.log('Notification permission status after request:', status);
    return status;
  };

  // const testImmediateNotification = async () => {
  //   try {
  //     const identifier = await Notifications.scheduleNotificationAsync({
  //       content: {
  //         title: 'Test Notification',
  //         body: 'This is a test notification to check immediate delivery.',
  //         sound: true,
  //         priority: 'max',
  //         vibrate: [0, 250, 250, 250],
  //       },
  //       trigger: {
  //         seconds: 5, // Trigger after 5 seconds
  //       },
  //     });

  //     console.log(`Immediate notification scheduled with ID: ${identifier}`);
  //   } catch (error) {
  //     console.error('Error scheduling immediate notification:', error);
  //   }
  // };

  if (!fontsLoaded) {
    return null; // or a loading indicator
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <MenuProvider>
          <AppNavigation />
        </MenuProvider>
      </GestureHandlerRootView>
    </NavigationContainer>
  );
}

