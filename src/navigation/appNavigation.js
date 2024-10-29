import React, { useEffect } from 'react'
import { View } from 'react-native';
import { Entypo } from "@expo/vector-icons";
import { NavigationContainer } from '@react-navigation/native';
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
            <Stack.Screen name="GuidedSession" component={GuidedSession} />
            <Stack.Screen name="SoloSessionSetup" component={SoloSessionSetup} />
            <Stack.Screen name="SoloSessionCall" component={RecordScreen} />
            <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
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
                { name: "Explore", component: ExploreStack, icon: "compass" },
                { name: "Settings", component: SettingsScreen, icon: "user" },
            ].map(({ name, component, icon }) => (
                <Tab.Screen
                    key={name}
                    name={name}
                    component={component}
                    options={{
                        tabBarIcon: ({ focused }) => (
                            <View style={{ alignItems: "center", justifyContent: "center" }}>
                                <Entypo name={icon} size={24} color={focused ? "#FFF" : "#8B8B8B"} />
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
            <CallStack.Screen name="SoloSessionCall" component={RecordScreen} />
            <CallStack.Screen name="GuidedSessionCall" component={GuidedSessionCall} />
        </CallStack.Navigator>
    );
}

export default function AppNavigation() {
    const { user } = useAuth();

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {user ? (
                    <>
                        <Stack.Screen name="App" component={TabNavigator} />
                        <Stack.Screen name="CallStack" component={CallStackNavigator} />
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
        </NavigationContainer>
    );
}
