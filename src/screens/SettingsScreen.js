import React, { useEffect, useState } from 'react'
import { Alert, Button, ActivityIndicator, Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View, Linking } from 'react-native'
import {heightPercentageToDP as hp, widthPercentageToDP as wp} from 'react-native-responsive-screen';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../../config/firebase';
import useAuth from '../../hooks/useAuth';

export default function SettingsScreen() {
    const navigation = useNavigation();
    const { user, ready } = useAuth();

   const onLogout = async () => {
        try {
            await auth.signOut();
            console.log("User signed out successfully");
            // navigation.navigate('Auth');
        } catch (e) {
            console.log(e);
            Alert.alert("Logout Error", "An error occurred while trying to log out. Please try again.");

        }
    }

    const confirmLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you'd like to logout?",
            [
                {
                    text: "Cancel",
                    onPress: () => console.log("Logout canceled"),
                    style: "cancel"
                },
                {
                    text: "Confirm",
                    onPress: onLogout
                }
            ]
        );
    };

    const openURL = (url) => {
        Linking.openURL(url).catch((err) => {
            console.error("Failed to open URL:", err);
            Alert.alert("Failed to open URL. Please try again later.");
        });
    };

    if (!ready) {
        return (
            <View className="flex-1 justify-center items-center" style={{ backgroundColor: '#191A23' }}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={{ fontSize: wp(4.3), color: '#fff', marginTop: 10 }}>Loading...</Text>
            </View>
        );
    }

    return (
    <View className="flex-1" style={{ backgroundColor: '#191A23' }}>
        <SafeAreaView className="flex-1 flex mx-5">
            {/* {bot icon} */}
            <View className="flex-row justify-center" style={{height: hp(6)}}>
            </View>
            <View style={{height: hp(60)}} className="space-y-4">
                <Text style={{fontSize: wp(4.5)}} className="font-semibold text-white">Settings</Text>
               
               {/* <Text style={{fontSize: wp(3.5)}} className="font-regular text-gray-400">Voice Notes</Text>
                <View className="p-2.5 rounded-xl space-y-2" style={{ backgroundColor: '#242830' }}>
                    <View className="flex-row items-center space-x-1">
                        <Image source={require("../../assets/images/noteicon.png")} style={{height: hp(3), width: hp(3)}} className="mr-2"/>
                        <Text style={{fontSize: wp(4.3)}} className="font-bold text-white">Customize Output</Text>
                        <View className="flex-row items-center space-x-1"></View>
                    </View>
                </View> */}

                <Text style={{fontSize: wp(3.5)}} className="font-regular text-gray-400">Account</Text>
                <View className="p-2.5 rounded-xl space-y-2" style={{ backgroundColor: '#242830' }}>
                    <View className="flex-row items-center space-x-1">
                        <Image source={require("../../assets/images/noteicon.png")} style={{height: hp(3), width: hp(3)}} className="mr-2"/>
                        <Text style={{fontSize: wp(4.3)}} className="font-bold text-white">Account Details</Text>
                        <View className="flex-row items-center space-x-1"></View>
                    </View>
                </View>
                {/* <View className="p-2.5 rounded-xl space-y-2" style={{ backgroundColor: '#242830' }}>
                    <View className="flex-row items-center space-x-1">
                        <Image source={require("../../assets/images/noteicon.png")} style={{height: hp(3), width: hp(3)}} className="mr-2"/>
                        <Text style={{fontSize: wp(4.3)}} className="font-bold text-white">Subscription</Text>
                        <View className="flex-row items-center space-x-1"></View>
                    </View>
                </View> */}

                {/* <Text style={{fontSize: wp(3.5)}} className="font-regular text-gray-400">Integrations</Text>
                <View className="p-2.5 rounded-xl space-y-2" style={{ backgroundColor: '#242830' }}>
                    <View className="flex-row items-center space-x-1">
                        <Image source={require("../../assets/images/noteicon.png")} style={{height: hp(3), width: hp(3)}} className="mr-2"/>
                        <Text style={{fontSize: wp(4.3)}} className="font-bold text-white">Connected Integrations</Text>
                        <View className="flex-row items-center space-x-1"></View>
                    </View>
                </View> */}

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
                    <TouchableOpacity onPress={confirmLogout} className="p-2.5 rounded-xl space-y-2" style={{ backgroundColor: '#242830' }}>
                        <View className="flex-row items-center space-x-1">
                            <Image source={require("../../assets/images/noteicon.png")} style={{ height: hp(3), width: hp(3) }} className="mr-2" />
                            <Text style={{ fontSize: wp(4.3) }} className="font-bold text-white">
                                {ready ? (user ? "Logout" : "Not Logged In") : "Loading..."}
                            </Text>
                        </View>
                    </TouchableOpacity>
            </View>
        </SafeAreaView>
    </View>
    )
}