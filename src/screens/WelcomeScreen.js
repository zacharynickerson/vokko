import { Image, SafeAreaView, Text, TouchableOpacity, View } from 'react-native'
import {heightPercentageToDP as hp, widthPercentageToDP as wp} from 'react-native-responsive-screen';

import React from 'react'
import { useNavigation } from '@react-navigation/native';

export default function WelcomeScreen() {
    const navigation = useNavigation();

    return (
        
        <SafeAreaView className="flex-1 flex justify-around" style={{ backgroundColor: '#191A23' }}>
            <View className="space-y-2">
                <Text style={{fontSize: wp(10)}} className="text-center font-bold text-white">
                    Vokko
                </Text>
                <Text style={{fontSize: wp(4)}} className="text-center tracking-wider text-white font-semibold">
                    Your voice notes, powered by AI.
                </Text>
            </View>
            <View className="flex-row justify-center">
                <Image source={require("../../assets/images/crystal.png")} style={{width: wp(75), height: wp(75)}}/>
            </View>
            <View className="space-y-4">
                <View>
                <TouchableOpacity onPress={()=> navigation.navigate('SignUpScreen')} className="bg-white mx-5 p-4 rounded-2xl">
                        <Text style={{fontSize: wp(6)}} className="text-center font-bold text-black text-2xl">Sign Up</Text>
                </TouchableOpacity>
                </View>
                <View className="flex-row justify-center">
                    <Text className="text-white font-semibold">Already have an account? </Text>
                    <TouchableOpacity onPress={()=> navigation.navigate('LoginScreen')}>
                        <Text className="font-semibold text-cyan-400">Log In</Text>
                    </TouchableOpacity>
                </View>
            </View>
            
            
            
        </SafeAreaView>
    )
}