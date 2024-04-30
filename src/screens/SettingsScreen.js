import { Alert, Button, Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import {heightPercentageToDP as hp, widthPercentageToDP as wp} from 'react-native-responsive-screen';

import React from 'react'
import { useNavigation } from '@react-navigation/native';

export default function SettingsScreen() {
    const navigation = useNavigation();

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
                        <Image source={require("/Users/zacharynickerson/Desktop/vokko/assets/images/noteicon.png")} style={{height: hp(3), width: hp(3)}} className="mr-2"/>
                        <Text style={{fontSize: wp(4.3)}} className="font-bold text-white">Customize Output</Text>
                        <View className="flex-row items-center space-x-1"></View>
                    </View>
                </View>

                <Text style={{fontSize: wp(3.5)}} className="font-regular text-gray-400">Account</Text>
                <View className="p-2.5 rounded-xl space-y-2" style={{ backgroundColor: '#242830' }}>
                    <View className="flex-row items-center space-x-1">
                        <Image source={require("/Users/zacharynickerson/Desktop/vokko/assets/images/noteicon.png")} style={{height: hp(3), width: hp(3)}} className="mr-2"/>
                        <Text style={{fontSize: wp(4.3)}} className="font-bold text-white">Account Details</Text>
                        <View className="flex-row items-center space-x-1"></View>
                    </View>
                </View>
                <View className="p-2.5 rounded-xl space-y-2" style={{ backgroundColor: '#242830' }}>
                    <View className="flex-row items-center space-x-1">
                        <Image source={require("/Users/zacharynickerson/Desktop/vokko/assets/images/noteicon.png")} style={{height: hp(3), width: hp(3)}} className="mr-2"/>
                        <Text style={{fontSize: wp(4.3)}} className="font-bold text-white">Subscription</Text>
                        <View className="flex-row items-center space-x-1"></View>
                    </View>
                </View>

                <Text style={{fontSize: wp(3.5)}} className="font-regular text-gray-400">Integrations</Text>
                <View className="p-2.5 rounded-xl space-y-2" style={{ backgroundColor: '#242830' }}>
                    <View className="flex-row items-center space-x-1">
                        <Image source={require("/Users/zacharynickerson/Desktop/vokko/assets/images/noteicon.png")} style={{height: hp(3), width: hp(3)}} className="mr-2"/>
                        <Text style={{fontSize: wp(4.3)}} className="font-bold text-white">Connected Integrations</Text>
                        <View className="flex-row items-center space-x-1"></View>
                    </View>
                </View>

                <Text style={{fontSize: wp(3.5)}} className="font-regular text-gray-400">Support</Text>
                <View className="p-2.5 rounded-xl space-y-2" style={{ backgroundColor: '#242830' }}>
                    <View className="flex-row items-center space-x-1">
                        <Image source={require("/Users/zacharynickerson/Desktop/vokko/assets/images/noteicon.png")} style={{height: hp(3), width: hp(3)}} className="mr-2"/>
                        <Text style={{fontSize: wp(4.3)}} className="font-bold text-white">Contact Support</Text>
                        <View className="flex-row items-center space-x-1"></View>
                    </View>
                </View>

                <Text style={{fontSize: wp(3.5)}} className="font-regular text-gray-400">Security and Privacy</Text>
                <View className="p-2.5 rounded-xl space-y-2" style={{ backgroundColor: '#242830' }}>
                    <View className="flex-row items-center space-x-1">
                        <Image source={require("/Users/zacharynickerson/Desktop/vokko/assets/images/noteicon.png")} style={{height: hp(3), width: hp(3)}} className="mr-2"/>
                        <Text style={{fontSize: wp(4.3)}} className="font-bold text-white">Terms of Service</Text>
                        <View className="flex-row items-center space-x-1"></View>
                    </View>
                </View>
                <View className="p-2.5 rounded-xl space-y-2" style={{ backgroundColor: '#242830' }}>
                    <View className="flex-row items-center space-x-1">
                        <Image source={require("/Users/zacharynickerson/Desktop/vokko/assets/images/noteicon.png")} style={{height: hp(3), width: hp(3)}} className="mr-2"/>
                        <Text style={{fontSize: wp(4.3)}} className="font-bold text-white">Logout</Text>
                        <View className="flex-row items-center space-x-1"></View>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    </View>
    )
}