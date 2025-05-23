import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RecordScreen from '../screens/SoloSessionCall';
import SettingsScreen from '../screens/SettingsScreen';
import SignUpScreen from '../screens/SignUpScreen';
import VoiceNoteDetails from '../screens/VoiceNoteDetails';
import WelcomeScreen from '../screens/WelcomeScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import useAuth from '../../hooks/useAuth';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import RamblingsScreen from '../screens/RamblingsScreen';
import * as Notifications from 'expo-notifications';
import { ref, get } from 'firebase/database';
import { db } from '../../config/firebase';
import { OnboardingContext } from '../context/OnboardingContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator();
const CallStack = createNativeStackNavigator();

function CallStackNavigator() {
    return (
        <CallStack.Navigator screenOptions={{ headerShown: false }}>
            <CallStack.Screen name="SoloSessionCall" component={RecordScreen} />
        </CallStack.Navigator>
    );
}

export default function AppNavigation() {
    const { user, initializing } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [onboardingCompleted, setOnboardingCompleted] = useState(false);

    useEffect(() => {
        if (initializing) {
            return;
        }

        if (!user) {
            setIsLoading(false);
            return;
        }

        const checkOnboardingStatus = async () => {
            try {
                // First check AsyncStorage
                const storedStatus = await AsyncStorage.getItem(`onboarding_${user.uid}`);
                if (storedStatus === 'completed') {
                    setOnboardingCompleted(true);
                    setIsLoading(false);
                    return;
                }

                // If not in AsyncStorage, check Firebase
                const userRef = ref(db, `users/${user.uid}`);
                const snapshot = await get(userRef);
                
                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    const isCompleted = userData.onboardingCompleted || false;
                    setOnboardingCompleted(isCompleted);
                    
                    // Store in AsyncStorage if completed
                    if (isCompleted) {
                        await AsyncStorage.setItem(`onboarding_${user.uid}`, 'completed');
                    }
                } else {
                    // If user data doesn't exist, set onboarding as not completed
                    setOnboardingCompleted(false);
                }
                
                setIsLoading(false);
            } catch (error) {
                console.error('Error checking onboarding status:', error);
                // On error, default to showing onboarding
                setOnboardingCompleted(false);
                setIsLoading(false);
            }
        };

        checkOnboardingStatus();
    }, [user, initializing]);

    // Update AsyncStorage when onboarding is completed
    useEffect(() => {
        const updateOnboardingStorage = async () => {
            if (user && onboardingCompleted) {
                try {
                    await AsyncStorage.setItem(`onboarding_${user.uid}`, 'completed');
                } catch (error) {
                    console.error('Error saving onboarding status:', error);
                }
            }
        };

        updateOnboardingStorage();
    }, [onboardingCompleted, user]);

    // Show nothing while initializing or loading
    if (initializing || isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
        );
    }

    return (
        <OnboardingContext.Provider value={{ onboardingCompleted, setOnboardingCompleted }}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {user ? (
                    <>
                        {!onboardingCompleted ? (
                            <Stack.Screen 
                                name="Onboarding" 
                                component={OnboardingScreen}
                                options={{
                                    gestureEnabled: false,
                                    animation: 'fade'
                                }}
                            />
                        ) : (
                            <>
                                <Stack.Screen name="RamblingsScreen" component={RamblingsScreen} />
                                <Stack.Screen name="VoiceNoteDetails" component={VoiceNoteDetails} />
                                <Stack.Screen name="SoloSessionCall" component={RecordScreen} />
                                <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
                                <Stack.Screen 
                                    name="CallStack" 
                                    component={CallStackNavigator}
                                    options={{
                                        presentation: 'fullScreenModal',
                                        animation: 'slide_from_bottom'
                                    }}
                                />
                            </>
                        )}
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="SignUp" component={SignUpScreen} />
                        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                        <Stack.Screen name="Welcome" component={WelcomeScreen} />
                    </>
                )}
            </Stack.Navigator>
        </OnboardingContext.Provider>
    );
}
