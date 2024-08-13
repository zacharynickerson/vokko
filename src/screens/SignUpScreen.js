import React, { useState, useEffect } from 'react';
import { Image, Text, TextInput, TouchableOpacity, View, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeftIcon } from 'react-native-heroicons/solid';
import { useNavigation } from '@react-navigation/native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, db } from '../../config/firebase';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';

const { width } = Dimensions.get('window');

export default function SignUpScreen() {
    const navigation = useNavigation();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [isAppleSignInAvailable, setIsAppleSignInAvailable] = useState(false);

    useEffect(() => {
        AppleAuthentication.isAvailableAsync().then(setIsAppleSignInAvailable);
    }, []);

    const validate = () => {
        const errors = {};
        if (!name) errors.name = 'Name is required';
        if (!email) errors.email = 'Email is required';
        if (!password) errors.password = 'Password is required';
        if (password && password.length < 6) errors.password = 'Password must be at least 6 characters';
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
            const response = await createUserWithEmailAndPassword(auth, email, password);
            if (response.user) {
                const userData = {
                    name: name,
                    email: response.user.email,
                };
                await set(ref(db, `users/${response.user.uid}`), userData);
                console.log('Data written to the database successfully!');
                navigation.navigate('LibraryScreen');
            }
        } catch (err) {
            console.error("Signup error:", err);
            showCustomAlert('Signup Error', err.message);
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

    const handleGoogleSignUp = async () => {
        try {
            await GoogleSignin.hasPlayServices();
            const { idToken, user } = await GoogleSignin.signIn();
            const googleCredential = GoogleAuthProvider.credential(idToken);
            const userCredential = await signInWithCredential(auth, googleCredential);
            
            const userData = {
                name: user.name,
                email: user.email,
            };
            await set(ref(db, `users/${userCredential.user.uid}`), userData);
            
            console.log("User signed up successfully with Google");
            navigation.navigate('LibraryScreen');
        } catch (error) {
            console.error("Google Sign-Up error:", error);
            showCustomAlert('Google Sign-Up Error', 'An error occurred during Google sign-up. Please try again.');
        }
    };

    const handleAppleSignUp = async () => {
        try {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });
            
            // Here you would typically send the credential to your server or use it to sign in to Firebase
            console.log("User signed up successfully with Apple");
            navigation.navigate('LibraryScreen');
        } catch (error) {
            if (error.code === 'ERR_CANCELED') {
                console.log('User cancelled Apple Sign-In');
            } else {
                console.error("Apple Sign-Up error:", error);
                showCustomAlert('Apple Sign-Up Error', 'An error occurred during Apple sign-up. Please try again.');
            }
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1, backgroundColor: '#191A23' }}
        >
            <SafeAreaView style={{ flex: 1, paddingTop: 50 }}> 
                <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 20 }}
                    >
                        <ArrowLeftIcon size={20} color="white" />
                    </TouchableOpacity>
                    <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>Sign Up</Text>
                    <View style={{ width: 40 }} /> 
                </View>

                <View style={{ paddingHorizontal: 30 }}>
                    <Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' }}>Create Account</Text>
                
                <View style={{ marginBottom: 20 }}>
                    <TextInput
                        style={{
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            padding: 15,
                            borderRadius: 10,
                            color: 'white',
                            fontSize: 16
                        }}
                        placeholder="Full Name"
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        value={name}
                        onChangeText={(value) => handleInputChange('name', value)}
                    />
                </View>
                
                <View style={{ marginBottom: 20 }}>
                    <TextInput
                        style={{
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            padding: 15,
                            borderRadius: 10,
                            color: 'white',
                            fontSize: 16
                        }}
                        placeholder="Email"
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        value={email}
                        onChangeText={(value) => handleInputChange('email', value)}
                        keyboardType="email-address"
                    />
                </View>
                
                <View style={{ marginBottom: 20 }}>
                    <TextInput
                        style={{
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            padding: 15,
                            borderRadius: 10,
                            color: 'white',
                            fontSize: 16
                        }}
                        placeholder="Password"
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        secureTextEntry={!passwordVisible}
                        value={password}
                        onChangeText={(value) => handleInputChange('password', value)}
                    />
                    <TouchableOpacity 
                        onPress={() => setPasswordVisible(!passwordVisible)}
                        style={{ position: 'absolute', right: 15, top: 15 }}
                    >
                        <Text style={{ color: 'rgba(255,255,255,0.6)' }}>{passwordVisible ? 'Hide' : 'Show'}</Text>
                    </TouchableOpacity>
                </View>
                
                <TouchableOpacity
                    onPress={handleSubmit}
                    style={{
                        backgroundColor: 'white',
                        padding: 15,
                        borderRadius: 10,
                        alignItems: 'center',
                        marginBottom: 30
                    }}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#191A23" />
                    ) : (
                        <Text style={{ color: '#191A23', fontSize: 18, fontWeight: 'bold' }}>Sign Up</Text>
                    )}
                </TouchableOpacity>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 30 }}>
                    <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                    <Text style={{ color: 'rgba(255,255,255,0.6)', paddingHorizontal: 10 }}>Or create an account with</Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                </View>
                
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 30 }}>
                    <TouchableOpacity 
                        onPress={handleGoogleSignUp} 
                        style={{ 
                            marginRight: 20, 
                            backgroundColor: 'rgba(255,255,255,0.1)', 
                            padding: 10, 
                            borderRadius: 10 
                        }}
                    >
                        <Image source={require('../../assets/images/google.png')} style={{ width: 30, height: 30 }} />
                    </TouchableOpacity>
                    {isAppleSignInAvailable && (
                        <TouchableOpacity 
                            onPress={handleAppleSignUp}
                            style={{ 
                                backgroundColor: 'rgba(255,255,255,0.1)', 
                                padding: 10, 
                                borderRadius: 10 
                            }}
                        >
                            <Image source={require('../../assets/images/apple-logo-transparent.png')} style={{ width: 30, height: 30 }} />
                        </TouchableOpacity>
                    )}
                </View>
                
                <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                    <Text style={{ color: 'rgba(255,255,255,0.6)' }}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>Login</Text>
                    </TouchableOpacity>
                </View>
</View>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}
