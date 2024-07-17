import React, { useEffect, useState } from 'react'
import { View, Platform } from 'react-native';
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
import useAuth from '../../hooks/useAuth';

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

function LibraryStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="LibraryScreen" component={LibraryScreen} />
            <Stack.Screen name="VoiceNoteDetails" component={VoiceNoteDetails} />
        </Stack.Navigator>
    );
}

function TabNavigator() {
    return (
        <Tab.Navigator screenOptions={screenOptions} initialRouteName='RecordScreen'>
            <Tab.Screen
                name="Library"
                component={LibraryStack}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <View style={{ alignItems: "center", justifyContent: "center" }}>
                            <Entypo name="list" size={24} color={focused ? "#FFF" : "#8B8B8B"} />
                        </View>
                    ),
                    tabBarStyle: { backgroundColor: "#1F222A" },
                }}
            />
            <Tab.Screen
                name="Record"
                component={RecordScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <View
                            style={{
                                top: Platform.OS === "ios" ? 0 : 0,
                                width: Platform.OS === "ios" ? 60 : 50,
                                height: Platform.OS === "ios" ? 60 : 50,
                                borderRadius: Platform.OS === "ios" ? 25 : 30,
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "#FFF",
                            }}
                        >
                            <Entypo name="plus" size={24} color={focused ? "#1F222A" : "#8B8B8B"} />
                        </View>
                    ),
                    tabBarStyle: { backgroundColor: "#1F222A" },
                }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <View style={{ alignItems: "center", justifyContent: "center" }}>
                            <Entypo name="cog" size={24} color={focused ? "#FFF" : "#8B8B8B"} />
                        </View>
                    ),
                    tabBarStyle: { backgroundColor: "#1F222A" },
                }}
            />
        </Tab.Navigator>
    );
}

export default function AppNavigation() {
    const { user } = useAuth();

    // console.log("Current user in AppNavigation:", user.email); // Add this line


    useEffect(() => {
        // console.log("AppNavigation re-rendered. User:", user);
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
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

