import { Image, Text, TextInput, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import { ArrowLeftIcon } from 'react-native-heroicons/solid';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import useAuth from '../../hooks/useAuth';

export default function LoginScreen() {
    const navigation = useNavigation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [passwordVisible, setPasswordVisible] = useState(false);
    const { updateUser } = useAuth();


    const validate = () => {
        const errors = {};
        if (!email) errors.email = 'Email is required';
        if (!password) errors.password = 'Password is required';
        return errors;
    };

    const showCustomAlert = (title, message) => {
        Alert.alert(
            title,
            message,
            [{ text: 'OK', onPress: () => console.log('OK Pressed') }],
            { cancelable: false }
        );
    };

    const handleSubmit = async () => {
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log("User signed in successfully");
            updateUser(userCredential.user);  // Update the user state
        } catch (err) {
            console.error("Login error:", err);
            if (err.code === 'auth/user-not-found') {
                showCustomAlert('Account Not Found', 'No user exists with this email. Please check your email or sign up for a new account.');
            } else if (err.code === 'auth/wrong-password') {
                showCustomAlert('Incorrect Password', 'The password you entered is incorrect. Please try again.');
            } else if (err.code === 'auth/too-many-requests') {
                showCustomAlert('Too Many Attempts', 'You have made too many login attempts. Please try again later or reset your password.');
            } else {
                showCustomAlert('Login Error', 'An unexpected error occurred. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    
    const handleInputChange = (field, value) => {
        setErrors(prevErrors => ({ ...prevErrors, [field]: '' }));
        if (field === 'email') {
            setEmail(value);
        } else if (field === 'password') {
            setPassword(value);
        }
    };

    return (
        <View className="flex-1" style={{ backgroundColor: '#191A23' }}>
            <SafeAreaView className="flex">
                <View className="flex-row justify-start">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="bg-white p-2 rounded-tr-2xl rounded-bl-2xl ml-4">
                        <ArrowLeftIcon size="20" color="black" />
                    </TouchableOpacity>
                </View>
                <View className="flex-row justify-center">
                    <Image source={require('../../assets/images/glasshead.png')}
                        style={{ width: 100, height: 170, margin: 1 }} // Reduced size
                    />
                </View>
            </SafeAreaView>

            <View className="flex-1 bg-white px-8 pt-8"
                style={{ borderTopLeftRadius: 50, borderTopRightRadius: 50 }}
            >
                <View className="form space-y-4">
                    <Text className="text-gray-700 ml-4">Email Address</Text>
                    <View className="relative">
                        <TextInput
                            className="p-4 bg-gray-100 text-gray-700 rounded-2xl mb-1"
                            value={email}
                            onChangeText={value => handleInputChange('email', value)}
                            placeholder={errors.email || "Enter Email"}
                            keyboardType="email-address"
                            style={[{ borderColor: errors.email ? 'red' : 'transparent', borderWidth: 1 }]}
                        />
                    </View>

                    <Text className="text-gray-700 ml-4">Password</Text>
                    <View className="relative flex-row items-center bg-gray-100 rounded-2xl mb-1"
                        style={[{ borderColor: errors.password ? 'red' : 'transparent', borderWidth: 1 }]}
                    >
                        <TextInput
                            className="p-4 text-gray-700 flex-1"
                            secureTextEntry={!passwordVisible}
                            value={password}
                            onChangeText={value => handleInputChange('password', value)}
                            placeholder={errors.password || "Enter Password"}
                        />
                        <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
                            <Text className="p-4 text-gray-500">{passwordVisible ? 'Hide' : 'Show'}</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity className="flex items-end mb-5">
                        <Text className="text-gray-700">Forgot Password?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleSubmit}
                        className="py-3 rounded-xl"
                        style={{ backgroundColor: '#191A23' }}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text className="text-xl font-bold text-center text-white">
                                Login
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
                    <Text className="text-gray-500 font-semibold">Don't have an account yet? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('SignUpScreen')}>
                        <Text className="font-semibold" style={{ color: '#191A23' }}>Sign Up</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}
