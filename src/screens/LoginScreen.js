import React, { useEffect, useState } from 'react';
import { Image, Text, TextInput, TouchableOpacity, View, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeftIcon } from 'react-native-heroicons/solid';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../../config/firebase';
import useAuth from '../../hooks/useAuth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword, sendPasswordResetEmail, OAuthProvider } from 'firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';

export default function LoginScreen() {
    const navigation = useNavigation();
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [isAppleSignInAvailable, setIsAppleSignInAvailable] = useState(false);
    // const { updateUser } = useAuth();

    useEffect(() => {
        AppleAuthentication.isAvailableAsync().then(setIsAppleSignInAvailable);
    }, []);

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
            await signIn(email, password);
            console.log("User signed in successfully");
            navigation.navigate('LibraryScreen');
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

    const handleGoogleSignIn = async () => {
        try {
            await GoogleSignin.hasPlayServices();
            const { idToken } = await GoogleSignin.signIn();
            const googleCredential = GoogleAuthProvider.credential(idToken);
            await signInWithCredential(auth, googleCredential);
            console.log("User signed in successfully with Google");
            navigation.navigate('LibraryScreen');
        } catch (error) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                // user cancelled the login flow
            } else if (error.code === statusCodes.IN_PROGRESS) {
                // operation (e.g. sign in) is in progress already
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                // play services not available or outdated
            } else {
                // some other error happened
                console.error("Google Sign-In error:", error);
                showCustomAlert('Google Sign-In Error', 'An error occurred during Google sign-in. Please try again.');
            }
        }
    };


    const handleAppleSignIn = async () => {
        try {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });
            // Here, you would typically send the credential to your server or use it to sign in to Firebase
            // For this example, we'll assume you have a function to handle Apple sign-in with Firebase
            // await signInWithApple(credential);
            console.log("User signed in successfully with Apple");
            navigation.navigate('LibraryScreen');
        } catch (e) {
            if (e.code === 'ERR_CANCELED') {
                // handle that the user canceled the sign-in flow
                console.log('User cancelled Apple Sign-In');
            } else {
                // handle other errors
                console.error('Error during Apple Sign-In:', e);
                showCustomAlert('Apple Sign-In Error', 'An error occurred during Apple sign-in. Please try again.');
            }
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

    const resetPassword = async () => {
        try {
            sendPasswordResetEmail(auth, email)
            alert('Please check your email to reset your password')
        } catch ({ message }) {
            alert(message)
        }
    }

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
                    <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>Login</Text>
                    <View style={{ width: 40 }} /> 
                </View>

                <View style={{ paddingHorizontal: 30 }}>
                    <Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' }}>Welcome Back</Text>
                    
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
                    
                    <TouchableOpacity onPress={resetPassword} style={{ alignSelf: 'flex-end', marginBottom: 30 }}>
                        <Text style={{ color: 'rgba(255,255,255,0.6)' }}>Forgot Password?</Text>
                    </TouchableOpacity>
                    
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
                            <Text style={{ color: '#191A23', fontSize: 18, fontWeight: 'bold' }}>Login</Text>
                        )}
                    </TouchableOpacity>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 30 }}>
                        <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                        <Text style={{ color: 'rgba(255,255,255,0.6)', paddingHorizontal: 10 }}>Or continue with</Text>
                        <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                    </View>
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 30 }}>
                        <TouchableOpacity 
                            onPress={handleGoogleSignIn} 
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
                                onPress={handleAppleSignIn}
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
                        <Text style={{ color: 'rgba(255,255,255,0.6)' }}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('SignUpScreen')}>
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}
