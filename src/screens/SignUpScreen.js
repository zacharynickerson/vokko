import React, { useState } from 'react';
import { Button, Alert, Image, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { ArrowLeftIcon } from 'react-native-heroicons/solid';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../config/firebase';

export default function SignUpScreen() {
    const navigation = useNavigation();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [passwordVisible, setPasswordVisible] = useState(false);

    const validate = () => {
        const errors = {};
        if (!name) errors.name = 'Name is required';
        if (!email) errors.email = 'Email is required';
        if (!password) errors.password = 'Password is required';
        if (password && password.length < 6) errors.password = 'Password must be at least 6 characters';
        return errors;
    };

    const handleSubmit = async () => {
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        setLoading(true);
        try {
            const response = await createUserWithEmailAndPassword(auth, email, password);
            if (response.user) {
                const userData = {
                    name: name,
                    email: response.user.email,
                };
                await set(ref(db, `/users/${response.user.uid}`), userData);
                console.log('Data written to the database successfully!');
                navigation.navigate('HomeScreen'); // Redirect to the main screen after successful signup
            }
        } catch (err) {
            Alert.alert('Error', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setErrors(prevErrors => ({ ...prevErrors, [field]: '' }));
        if (field === 'name') {
            setName(value);
        } else if (field === 'email') {
            setEmail(value);
        } else if (field === 'password') {
            setPassword(value);
        }
    };

    return (
        <View className="flex-1 bg-emerald-400" style={{ backgroundColor: '#191A23' }}>
            <SafeAreaView className="flex">
                <View className="flex-row justify-start">
                    <TouchableOpacity onPress={() => navigation.goBack()}
                        className="bg-white p-2 rounded-tr-2xl rounded-bl-2xl ml-4">
                        <ArrowLeftIcon size="20" color="black" />
                    </TouchableOpacity>
                </View>
                <View className="flex-row justify-center">
                    <Image source={require('../../assets/images/glasscog.png')}
                        style={{ width: 140, height: 140 }}
                    />
                </View>
            </SafeAreaView>
            <View className="flex-1 bg-white px-8 pt-8"
                style={{ borderTopLeftRadius: 50, borderTopRightRadius: 50 }}
            >
                <View className="form space-y-2">
                    <Text className="text-gray-700 ml-4">Full Name</Text>
                    <View className="relative">
                        <TextInput
                            className="p-4 bg-gray-100 text-gray-700 rounded-2xl mb-3"
                            value={name}
                            onChangeText={value => handleInputChange('name', value)}
                            placeholder={errors.name ? "" : "Enter Name"}
                            style={errors.name ? { borderColor: 'red', borderWidth: 1 } : {}}
                        />
                        {errors.name && (
                            <Text className="absolute left-4 top-4 text-red-500">{errors.name}</Text>
                        )}
                    </View>

                    <Text className="text-gray-700 ml-4">Email Address</Text>
                    <View className="relative">
                        <TextInput
                            className="p-4 bg-gray-100 text-gray-700 rounded-2xl mb-3"
                            value={email}
                            onChangeText={value => handleInputChange('email', value)}
                            placeholder={errors.email ? "" : "Enter Email"}
                            keyboardType="email-address"
                            style={errors.email ? { borderColor: 'red', borderWidth: 1 } : {}}
                        />
                        {errors.email && (
                            <Text className="absolute left-4 top-4 text-red-500">{errors.email}</Text>
                        )}
                    </View>

                    <Text className="text-gray-700 ml-4">Password</Text>
                    <View className="relative flex-row items-center bg-gray-100 rounded-2xl mb-1" style={errors.password ? { borderColor: 'red', borderWidth: 1 } : {}}>
                        <TextInput
                            className="p-4 text-gray-700 flex-1"
                            secureTextEntry={!passwordVisible}
                            value={password}
                            onChangeText={value => handleInputChange('password', value)}
                            placeholder={errors.password ? "" : "Enter Password"}
                        />
                        <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
                            <Text className="p-4 text-gray-500">{passwordVisible ? 'Hide' : 'Show'}</Text>
                        </TouchableOpacity>
                    </View>
                    {errors.password && (
                        <Text className="text-left ml-4 mb-4 text-red-500">{errors.password}</Text>
                    )}

                    <TouchableOpacity
                        className="py-3 bg-400 rounded-xl"
                        style={{ backgroundColor: '#191A23' }}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text className="font-xl font-bold text-center text-white">
                                Sign Up
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                <Text className="text-xl text-gray-700 font-bold text-center py-5">
                    Or
                </Text>
                <View className="flex-row justify-center space-x-12">
                    <TouchableOpacity className="p-2 bg-gray-100 rounded-2xl">
                        <Image source={require('../../assets/images/google.png')}
                            className="w-10 h-10" />
                    </TouchableOpacity>
                    <TouchableOpacity className="p-2 bg-gray-100 rounded-2xl">
                        <Image source={require('../../assets/images/apple-logo-transparent.png')}
                            className="w-10 h-10" />
                    </TouchableOpacity>
                    <TouchableOpacity className="p-2 bg-gray-100 rounded-2xl">
                        <Image source={require('../../assets/images/facebook.png')}
                            className="w-10 h-10" />
                    </TouchableOpacity>
                </View>
                <View className="flex-row justify-center mt-7">
                    <Text className="text-gray-500 font-semibold">Already have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
                        <Text className="font-semibold" style={{ color: '#191A23' }}>Login</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}
