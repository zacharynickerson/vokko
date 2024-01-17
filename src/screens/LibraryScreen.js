import { Alert, Button, Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import {heightPercentageToDP as hp, widthPercentageToDP as wp} from 'react-native-responsive-screen';

import React from 'react'
import { useNavigation } from '@react-navigation/native';

export default function LibraryScreen() {
    const navigation = useNavigation();

return (
    <View className="flex-1" style={{ backgroundColor: '#191A23' }}>
        <SafeAreaView className="flex-1 flex mx-5">
            <View className="flex-row justify-center" style={{height: hp(6)}}>
            </View>
            <View style={{height: hp(60)}} className="space-y-4">

                <Text style={{fontSize: wp(3.5)}} className="font-regular text-gray-400">Hello Zachary</Text>
                <Text style={{fontSize: wp(4.5)}} className="font-semibold text-white">Voice Notes</Text>
                
                <View className="p-4 rounded-xl space-y-2" style={{ backgroundColor: '#242830' }}>
                    <View className="flex-row items-center space-x-1">
                        <Image source={require("/Users/zacharynickerson/VokkoApp/assets/images/noteicon.png")} style={{height: hp(3), width: hp(3)}} className="mr-2"/>
                        <Text style={{fontSize: wp(4.3)}} className="font-bold text-white">15 Tasks For Cleaning Up My Life</Text>
                        <View className="flex-row items-center space-x-1"></View>
                    </View>
                    <Text style={{fontSize: wp(4)}} className="text-gray-400 font-regular">Sep 13, 2023 - Lapa, Lisboa</Text>
                </View>
                <View className="p-4 rounded-xl space-y-2" style={{ backgroundColor: '#242830' }}>
                    <View className="flex-row items-center space-x-1">
                        <Image source={require("/Users/zacharynickerson/VokkoApp/assets/images/noteicon.png")} style={{height: hp(3), width: hp(3)}} className="mr-2"/>
                        <Text style={{fontSize: wp(4.3)}} className="font-bold text-white">Wardrobe Review</Text>
                    </View>
                    <Text style={{fontSize: wp(4)}} className="text-gray-400 font-regular">Sep 11, 2023 - Lapa, Lisboa</Text>
                </View>
                <View className="p-4 rounded-xl space-y-2" style={{ backgroundColor: '#242830' }}>
                    <View className="flex-row items-center space-x-1">
                        <Image source={require("/Users/zacharynickerson/VokkoApp/assets/images/noteicon.png")} style={{height: hp(3), width: hp(3)}} className="mr-2"/>
                        <Text style={{fontSize: wp(4.3)}} className="font-bold text-white">Review for Portuguese Test</Text>
                    </View>
                    <Text style={{fontSize: wp(4)}} className="text-gray-400 font-regular">Sep 10, 2023 - Lapa, Lisboa</Text>
                </View>
                <View className="p-4 rounded-xl space-y-2" style={{ backgroundColor: '#242830' }}>
                    <View className="flex-row items-center space-x-1">
                        <Image source={require("/Users/zacharynickerson/VokkoApp/assets/images/noteicon.png")} style={{height: hp(3), width: hp(3)}} className="mr-2"/>
                        <Text style={{fontSize: wp(4.3)}} className="font-bold text-white">Along the banks of the Tejo</Text>
                    </View>
                    <Text style={{fontSize: wp(4)}} className="text-gray-400 font-regular">Sep 9, 2023 - Lapa, Lisboa</Text>
                </View>
            </View>
        </SafeAreaView>
    </View>
    )
}