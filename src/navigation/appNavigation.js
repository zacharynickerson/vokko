import React, { useEffect } from 'react'
import { View } from 'react-native';
import { Entypo } from "@expo/vector-icons";
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LibraryScreen from '../screens/LibraryScreen';
import LoginScreen from '../screens/LoginScreen';
import RecordScreen from '../screens/RecordScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SignUpScreen from '../screens/SignUpScreen';
import VoiceNoteDetails from '../screens/VoiceNoteDetails';
import WelcomeScreen from '../screens/WelcomeScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import useAuth from '../../hooks/useAuth';
import GuidedSession from '../screens/GuidedSession';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

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

const tabBarStyle = { backgroundColor: "#1F222A" };

function LibraryStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="LibraryScreen" component={LibraryScreen} />
            <Stack.Screen name="VoiceNoteDetails" component={VoiceNoteDetails} />
            <Stack.Screen name="GuidedSession" component={GuidedSession} />
            <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
        </Stack.Navigator>
    );
}

function TabNavigator() {
    return (
        <Tab.Navigator screenOptions={{ ...screenOptions, tabBarStyle }}>
            {[
                { name: "Library", component: LibraryStack, icon: "list" },
                { name: "Record", component: RecordScreen, icon: "plus" },
                { name: "GuidedSession", component: GuidedSession, icon: "chat" },
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

export default function AppNavigation() {
    const { user } = useAuth();

    useEffect(() => {
    }, [user]);

    
    return (
        <NavigationContainer>
            <Stack.Navigator>
                {user ? (
                    <Stack.Screen
                        name="App"
                        component={TabNavigator}
                        options={{ headerShown: false }}
                    />
                ) : (
                    <>
                        <Stack.Screen
                            name="WelcomeScreen"
                            component={WelcomeScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="LoginScreen"
                            component={LoginScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="SignUpScreen"
                            component={SignUpScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="ForgotPasswordScreen"
                            component={ForgotPasswordScreen}
                            options={{ headerShown: false }}
                        />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
