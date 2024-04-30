import {Image, Text, TextInput, TouchableOpacity, View} from 'react-native';
import React, {useState} from 'react';

import {ArrowLeftIcon} from 'react-native-heroicons/solid';
import HomeScreen from './RecordScreen';
import {SafeAreaView} from 'react-native-safe-area-context';
import { auth } from '../../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import {useNavigation} from '@react-navigation/native';

export default function LoginScreen() {
    const navigation = useNavigation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const handleSubmit = async ()=>{
        if(email && password){
            try{
                await signInWithEmailAndPassword(auth, email, password);
            }catch(err){
                console.log('got error: ',err.message);
            }
        }
    }

    return (
        <View className="flex-1"  style={{ backgroundColor: '#191A23' }}>
            <SafeAreaView className="flex">
                <View className="flex-row justify-start">

                    {/* <TouchableOpacity  
                        onPress={()=> navigation.goBack}
                        className="bg-white p-2 rounded-tr-2xl rounded-bl-2xl ml-4">
                        <ArrowLeftIcon size="20" color="black" />
                    </TouchableOpacity>    */}
            
                </View>
                <View className="flex-row justify-center">
                    <Image source={require('/Users/zacharynickerson/Desktop/vokko/assets/images/glasshead.png')}
                        style={{width: 149, height: 224, margin: 1}}
                    />
                </View>
            </SafeAreaView>


            <View className="flex-1 bg-white px-8 pt-8"
                style={{borderTopLeftRadius: 50, borderTopRightRadius: 50}}
            >
                <View className="form space-y-2">
                    <Text className="text-gray-700 ml-4">Email Address</Text>
                    <TextInput
                        className="p-4 bg-gray-100 text-gray-700 rounded-2xl mb-3"
                        value={email}
                        onChangeText={value=> setEmail(value)}
                        placeholder="Enter Email"
                    />
                    <Text className="text-gray-700 ml-4">Password</Text>
                    <TextInput
                        className="p-4 bg-gray-100 text-gray-700 rounded-2xl"
                        secureTextEntry
                        value={password}
                        onChangeText={value=> setPassword(value)}
                        placeholder="Enter Password"
                    />
                    <TouchableOpacity className="flex items-end mb-5">
                        <Text className="text-gray-700">Forgot Password?</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleSubmit}
                        className="py-3 rounded x-l" 
                        style={{ backgroundColor: '#191A23' }}
                    >
                        <Text className="font-xl font-bold text-center text-white">
                            Login
                        </Text>
                    </TouchableOpacity>    
                </View>
                <Text className="text-xl text-gray-700 font-bold text-center py-5">
                    Or
                </Text>
                <View className="flex-row justify-center space-x-12">
                    <TouchableOpacity className="p-2 bg-gray-100 rounded-2xl">
                        <Image source={require('/Users/zacharynickerson/Desktop/vokko/assets/images/google.png')}
                        className="w-10 h-10" />
                    </TouchableOpacity>
                    <TouchableOpacity className="p-2 bg-gray-100 rounded-2xl">
                        <Image source={require('/Users/zacharynickerson/Desktop/vokko/assets/images/apple-logo-transparent.png')}
                        className="w-10 h-10" />
                    </TouchableOpacity>
                    <TouchableOpacity className="p-2 bg-gray-100 rounded-2xl">
                        <Image source={require('/Users/zacharynickerson/Desktop/vokko/assets/images/facebook.png')}
                        className="w-10 h-10" />
                    </TouchableOpacity>
                </View>
                <View className="flex-row justify-center mt-7">
                    <Text className="text-gray-500 font-semibold">Don't have an account yet? </Text>
                    <TouchableOpacity onPress={()=> navigation.navigate('SignUpScreen')}>
                        <Text className="font-semibold" style={{ color: '#191A23' }}>Sign Up</Text>
                    </TouchableOpacity>
                </View>
            </View>
    </View>

    )
}
