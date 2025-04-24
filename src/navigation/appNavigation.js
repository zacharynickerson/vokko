import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { Entypo } from "@expo/vector-icons";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import LibraryScreen from '../screens/LibraryScreen';
import LoginScreen from '../screens/LoginScreen';
import RecordScreen from '../screens/SoloSessionCall';
import SettingsScreen from '../screens/SettingsScreen';
import SignUpScreen from '../screens/SignUpScreen';
import VoiceNoteDetails from '../screens/VoiceNoteDetails';
import WelcomeScreen from '../screens/WelcomeScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import useAuth from '../../hooks/useAuth';
import GuidedSession from '../screens/GuidedSessionSetup';
import ExploreScreen from '../screens/ExploreScreen';
import SoloSessionSetup from '../screens/SoloSessionSetup';
import GuidedSessionCall from '../screens/GuidedSessionCall';
import IncomingCallScreen from '../screens/IncomingCallScreen';
import ScheduledSessionsScreen from '../screens/ScheduledSessionsScreen';
import GuidedSessionsScreen from '../screens/GuidedSessionsScreen';
import * as Notifications from 'expo-notifications';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const CallStack = createNativeStackNavigator();

const screenOptions = {
    tabBarShowLabel: false,
    headerShown: false,
    tabBarStyle: {
        position: "absolute",
        bottom: 0,
        right: 0,
        left: 0,
        elevation: 0,
        height: 60,
        backgroundColor: "#1F222A",
    }
};

const tabBarStyle = { backgroundColor: "#1B1D21" };

function HomeStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="HomeScreen" component={HomeScreen} />
            <Stack.Screen name="VoiceNoteDetails" component={VoiceNoteDetails} />
            <Stack.Screen name="GuidedSession" component={GuidedSession} />
            <Stack.Screen name="SoloSessionSetup" component={SoloSessionSetup} />
            <Stack.Screen name="SoloSessionCall" component={RecordScreen} />
            <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
            <Stack.Screen name="ScheduledSessions" component={ScheduledSessionsScreen} />
            <Stack.Screen name="GuidedSessionsScreen" component={GuidedSessionsScreen} />
            <Stack.Screen name="ExploreScreen" component={ExploreScreen} />
        </Stack.Navigator>
    );
}

function LibraryStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="LibraryScreen" component={LibraryScreen} />
            <Stack.Screen name="VoiceNoteDetails" component={VoiceNoteDetails} />
            <Stack.Screen name="GuidedSession" component={GuidedSession} />
            <Stack.Screen name="SoloSessionSetup" component={SoloSessionSetup} />
            <Stack.Screen name="SoloSessionCall" component={RecordScreen} />
            <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
        </Stack.Navigator>
    );
}

function ExploreStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ExploreScreen" component={ExploreScreen} />
            <Stack.Screen name="GuidedSession" component={GuidedSession} />
            <Stack.Screen name="SoloSessionSetup" component={SoloSessionSetup} />
            <Stack.Screen name="SoloSessionCall" component={RecordScreen} />
            <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
        </Stack.Navigator>
    );
}

function TabNavigator() {
    return (
        <Tab.Navigator screenOptions={{ ...screenOptions, tabBarStyle }}>
            {[
                { name: "Home", component: HomeStack, icon: "home" },
                { name: "Library", component: LibraryStack, icon: "list" },
                { name: "Settings", component: SettingsScreen, icon: "user" },
            ].map(({ name, component, icon }) => (
                <Tab.Screen
                    key={name}
                    name={name}
                    component={component}
                    options={{
                        tabBarIcon: ({ focused }) => (
                            <View style={{ 
                                alignItems: "center", 
                                justifyContent: "center",
                                backgroundColor: focused ? "#2A2D36" : "transparent",
                                padding: 8,
                                borderRadius: 8
                            }}>
                                <Entypo 
                                    name={icon} 
                                    size={24} 
                                    color={focused ? "#FFF" : "#8B8B8B"} 
                                />
                            </View>
                        ),
                    }}
                />
            ))}
        </Tab.Navigator>
    );
}

function CallStackNavigator() {
    return (
        <CallStack.Navigator screenOptions={{ headerShown: false }}>
            <CallStack.Screen 
                name="IncomingCall" 
                component={IncomingCallScreen}
                options={{
                    presentation: 'fullScreenModal',
                    gestureEnabled: false,
                }}
            />
            <CallStack.Screen name="SoloSessionCall" component={RecordScreen} />
            <CallStack.Screen name="GuidedSessionCall" component={GuidedSessionCall} />
        </CallStack.Navigator>
    );
}

export default function AppNavigation() {
    const { user } = useAuth();
    const navigationRef = useRef();

    useEffect(() => {
        if (!user) return;

        // Set up notification handlers
        const notificationListener = Notifications.addNotificationReceivedListener(notification => {
            console.log('Received notification:', notification);
        });

        const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
            const sessionData = response.notification.request.content.data;
            
            if (navigationRef.current) {
                // Navigate to IncomingCall screen when notification is tapped
                navigationRef.current.navigate('CallStack', {
                    screen: 'IncomingCall',
                    params: { sessionData }
                });
            }
        });

        // Cleanup
        return () => {
            Notifications.removeNotificationSubscription(notificationListener);
            Notifications.removeNotificationSubscription(responseListener);
        };
    }, [user]);

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {user ? (
                <>
                    <Stack.Screen name="App" component={TabNavigator} />
                    <Stack.Screen 
                        name="CallStack" 
                        component={CallStackNavigator}
                        options={{
                            presentation: 'fullScreenModal',
                            animation: 'slide_from_bottom'
                        }}
                    />
                </>
            ) : (
                <>
                    <Stack.Screen name="WelcomeScreen" component={WelcomeScreen} />
                    <Stack.Screen name="LoginScreen" component={LoginScreen} />
                    <Stack.Screen name="SignUpScreen" component={SignUpScreen} />
                    <Stack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} />
                </>
            )}
        </Stack.Navigator>
    );
}
