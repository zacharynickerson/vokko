import React, { useEffect, useState } from 'react'
import { Alert, Button, Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View, Linking } from 'react-native'
import {heightPercentageToDP as hp, widthPercentageToDP as wp} from 'react-native-responsive-screen';
import { useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';

export default function SettingsScreen() {
    const navigation = useNavigation();
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const unsubscribe = auth().onAuthStateChanged(user => {
            console.log('Auth state changed:', user);
            setCurrentUser(user);
        });

        return unsubscribe; // Cleanup subscription on unmount
    }, []);

    useEffect(() => {
        console.log('Current user state updated:', currentUser);
    }, [currentUser]);

    const handleLogout = async () => {
        console.log('Logout triggered');
        if (currentUser) {
            try {
                await auth().signOut();
                console.log('User logged out successfully');
                navigation.replace('WelcomeScreen');
            } catch (error) {
                console.error("Failed to log out:", error);
                Alert.alert("Failed to log out. Please try again later.");
            }
        } else {
            Alert.alert("No user currently signed in.");
        }
    };

    const openURL = (url) => {
        Linking.openURL(url).catch((err) => {
            console.error("Failed to open URL:", err);
            Alert.alert("Failed to open URL. Please try again later.");
        });
    };

    return (
    <View className="flex-1" style={{ backgroundColor: '#191A23' }}>
        <SafeAreaView className="flex-1 flex mx-5">
            {/* {bot icon} */}
            <View className="flex-row justify-center" style={{height: hp(6)}}>
            </View>
            <View style={{height: hp(60)}} className="space-y-4">
                <Text style={{fontSize: wp(4.5)}} className="font-semibold text-white">Settings</Text>

                <Text style={{fontSize: wp(3.5)}} className="font-regular text-gray-400">Voice Notes</Text>
                <View className="p-2.5 rounded-xl space-y-2" style={{ backgroundColor: '#242830' }}>
                    <View className="flex-row items-center space-x-1">
                        <Image source={require("../../assets/images/noteicon.png")} style={{height: hp(3), width: hp(3)}} className="mr-2"/>
                        <Text style={{fontSize: wp(4.3)}} className="font-bold text-white">Customize Output</Text>
                        <View className="flex-row items-center space-x-1"></View>
                    </View>
                </View>

                <Text style={{fontSize: wp(3.5)}} className="font-regular text-gray-400">Account</Text>
                <View className="p-2.5 rounded-xl space-y-2" style={{ backgroundColor: '#242830' }}>
                    <View className="flex-row items-center space-x-1">
                        <Image source={require("../../assets/images/noteicon.png")} style={{height: hp(3), width: hp(3)}} className="mr-2"/>
                        <Text style={{fontSize: wp(4.3)}} className="font-bold text-white">Account Details</Text>
                        <View className="flex-row items-center space-x-1"></View>
                    </View>
                </View>
                <View className="p-2.5 rounded-xl space-y-2" style={{ backgroundColor: '#242830' }}>
                    <View className="flex-row items-center space-x-1">
                        <Image source={require("../../assets/images/noteicon.png")} style={{height: hp(3), width: hp(3)}} className="mr-2"/>
                        <Text style={{fontSize: wp(4.3)}} className="font-bold text-white">Subscription</Text>
                        <View className="flex-row items-center space-x-1"></View>
                    </View>
                </View>

                <Text style={{fontSize: wp(3.5)}} className="font-regular text-gray-400">Integrations</Text>
                <View className="p-2.5 rounded-xl space-y-2" style={{ backgroundColor: '#242830' }}>
                    <View className="flex-row items-center space-x-1">
                        <Image source={require("../../assets/images/noteicon.png")} style={{height: hp(3), width: hp(3)}} className="mr-2"/>
                        <Text style={{fontSize: wp(4.3)}} className="font-bold text-white">Connected Integrations</Text>
                        <View className="flex-row items-center space-x-1"></View>
                    </View>
                </View>

                <Text style={{ fontSize: wp(3.5) }} className="font-regular text-gray-400">Support</Text>
                    <TouchableOpacity onPress={() => openURL("https://vokko.io/contact/")} className="p-2.5 rounded-xl space-y-2" style={{ backgroundColor: '#242830' }}>
                        <View className="flex-row items-center space-x-1">
                            <Image source={require("../../assets/images/noteicon.png")} style={{ height: hp(3), width: hp(3) }} className="mr-2" />
                            <Text style={{ fontSize: wp(4.3) }} className="font-bold text-white">Contact Support</Text>
                            <View className="flex-row items-center space-x-1"></View>
                        </View>
                    </TouchableOpacity>

                    <Text style={{ fontSize: wp(3.5) }} className="font-regular text-gray-400">Security and Privacy</Text>
                    <TouchableOpacity onPress={() => openURL("https://vokko.io/")} className="p-2.5 rounded-xl space-y-2" style={{ backgroundColor: '#242830' }}>
                        <View className="flex-row items-center space-x-1">
                            <Image source={require("../../assets/images/noteicon.png")} style={{ height: hp(3), width: hp(3) }} className="mr-2" />
                            <Text style={{ fontSize: wp(4.3) }} className="font-bold text-white">Terms of Service</Text>
                            <View className="flex-row items-center space-x-1"></View>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleLogout} className="p-2.5 rounded-xl space-y-2" style={{ backgroundColor: '#242830' }}>
                        <View className="flex-row items-center space-x-1">
                            <Image source={require("../../assets/images/noteicon.png")} style={{ height: hp(3), width: hp(3) }} className="mr-2" />
                            <Text style={{ fontSize: wp(4.3) }} className="font-bold text-white">Logout</Text>
                        </View>
                    </TouchableOpacity>
            </View>
        </SafeAreaView>
    </View>
    )
}