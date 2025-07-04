import React, { useEffect, useState } from 'react';
import { Image, Text, TextInput, TouchableOpacity, View, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../config/firebase';
import useAuth from '../../hooks/useAuth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword, sendPasswordResetEmail, OAuthProvider, updateProfile, update } from 'firebase/auth';
import { ref, set } from 'firebase/database';

export default function LoginScreen() {
    const navigation = useNavigation();
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [showMoreOptions, setShowMoreOptions] = useState(false);
    const [showEmailLogin, setShowEmailLogin] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await signIn(email, password);
            console.log("User signed in successfully");
            // No need to navigate - the AppNavigation will handle this based on auth state
        } catch (err) {
            console.error("Login error:", err);
            Alert.alert('Login Error', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            await GoogleSignin.hasPlayServices();
            const { idToken, user } = await GoogleSignin.signIn();
            const googleCredential = GoogleAuthProvider.credential(idToken);
            const userCredential = await signInWithCredential(auth, googleCredential);
            
            // Get the photo URL from Google user object
            const photoURL = user.photo || user.photoURL;
            console.log('Google photo URL:', photoURL);
            
            // Update the user's display name in Firebase Auth
            await updateProfile(userCredential.user, {
                displayName: user.name,
                photoURL: photoURL
            });
            
            // Save user data to Realtime Database
            const userRef = ref(db, `users/${userCredential.user.uid}`);
            await set(userRef, {
                name: user.name,
                email: user.email,
                photoURL: photoURL,
                lastLoginAt: new Date().toISOString(),
                settings: {
                    notifications: true,
                }
            });
            
            console.log("User signed in successfully with Google");
            // No need to navigate - the AppNavigation will handle this based on auth state
        } catch (error) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED || error.message?.includes('canceled') || error.message?.includes('cancelled')) {
                return;
            }
            console.error("Google Sign-In error:", error);
            Alert.alert('Google Sign-In Error', 'An error occurred during Google sign-in. Please try again.');
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

    const navigateToForgotPassword = () => {
        navigation.navigate('ForgotPasswordScreen');
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                    <View style={styles.content}>
                        <View style={styles.headerContainer}>
                            <Text style={styles.title}>Let's Log You In</Text>
                            <Text style={styles.subtitle}>Welcome back, you've been missed!</Text>
                        </View>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={[styles.button, styles.googleButton]} onPress={handleGoogleSignIn}>
                                <Image source={require('../../assets/images/google.png')} style={styles.buttonIcon} />
                                <Text style={styles.buttonText}>Log in with Google</Text>
                            </TouchableOpacity>

                            {!showEmailLogin ? (
                                <TouchableOpacity 
                                    style={[styles.button, { backgroundColor: '#F9FAFA' }]} 
                                    onPress={() => setShowEmailLogin(true)}
                                >
                                    <View style={styles.emailIcon}>
                                        <Text style={styles.emailIconText}>✉️</Text>
                                    </View>
                                    <Text style={styles.buttonText}>Log in with Email</Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.emailLoginContainer}>
                                    <View style={styles.inputContainer}>
                                        <Text style={styles.inputLabel}>Email Address</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="hannah.turin@email.com"
                                            placeholderTextColor="#999"
                                            value={email}
                                            onChangeText={setEmail}
                                            keyboardType="email-address"
                                        />
                                    </View>
                                    <View style={styles.inputContainer}>
                                        <Text style={styles.inputLabel}>Password</Text>
                                        <View style={styles.passwordInputContainer}>
                                            <TextInput
                                                style={styles.passwordInput}
                                                placeholder="••••••"
                                                placeholderTextColor="#999"
                                                secureTextEntry={!passwordVisible}
                                                value={password}
                                                onChangeText={setPassword}
                                            />
                                            <TouchableOpacity 
                                                onPress={() => setPasswordVisible(!passwordVisible)}
                                                style={styles.passwordVisibilityButton}
                                            >
                                                <Text style={styles.showButtonText}>
                                                    {passwordVisible ? 'Hide' : 'Show'}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    <View style={styles.rememberForgotContainer}>
                                        <TouchableOpacity onPress={navigateToForgotPassword}>
                                            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <TouchableOpacity 
                                        style={[styles.button, styles.loginButton]} 
                                        onPress={handleSubmit}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="#FFF" />
                                        ) : (
                                            <Text style={[styles.buttonText, styles.loginButtonText]}>Login</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>
                </ScrollView>
                <View style={styles.signUpPromptContainer}>
                    <Text style={styles.signUpPromptText}>Don't have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                        <Text style={styles.signUpLink}>Sign Up</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    content: {
        flex: 1,
        padding: 20,
        justifyContent: 'flex-start',
    },
    headerContainer: {
        marginTop: 40,
        marginBottom: 30,
        marginHorizontal: 20,
    },
    title: {
        fontFamily: 'DM Sans',
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontFamily: 'DM Sans',
        fontSize: 20,
        color: '#666',
    },
    buttonContainer: {
        marginHorizontal: 20,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
    },
    buttonIcon: {
        width: 24,
        height: 24,
        marginRight: 10,
    },
    emailIcon: {
        width: 24,
        height: 24,
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emailIconText: {
        fontSize: 20,
    },
    buttonText: {
        fontFamily: 'DM Sans',
        fontWeight: 'bold',
        marginLeft: 10,
        fontSize: 16,
        color: '#333',
    },
    emailLoginContainer: {
        marginTop: 20,
        marginHorizontal: 20,
    },
    inputContainer: {
        marginBottom: 15,
    },
    inputLabel: {
        fontFamily: 'DM Sans',
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    input: {
        fontFamily: 'DM Sans',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
    },
    passwordInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 10,
    },
    passwordInput: {
        flex: 1,
        fontFamily: 'DM Sans',
        backgroundColor: 'transparent',
        padding: 15,
        fontSize: 16,
    },
    passwordVisibilityButton: {
        padding: 15,
    },
    showButtonText: {
        fontFamily: 'DM Sans',
        color: '#666',
        fontSize: 14,
    },
    rememberForgotContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: 20,
        marginHorizontal: 10,
    },
    
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 5,
        marginRight: 10,
    },
    forgotPasswordText: {
        fontFamily: 'DM Sans',
        color: '#4FBF67',
    },
    loginButton: {
        backgroundColor: '#4FBF67',
        justifyContent: 'center',
        marginHorizontal: 0,
    },
    loginButtonText: {
        fontFamily: 'DM Sans',
        color: '#FFF',
        fontWeight: 'bold',
    },
    signUpPromptContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    signUpPromptText: {
        fontFamily: 'DM Sans',
        color: '#666',
    },
    signUpLink: {
        fontFamily: 'DM Sans',
        color: '#4FBF67',
        fontWeight: 'bold',
    },
    googleButton: {
        backgroundColor: '#E6F6FE',
    },
    moreOptionsButton: {
        backgroundColor: '#F9FAFA',
    },
    moreOptionsText: {
        fontFamily: 'DM Sans',
        color: '#333',
        fontWeight: 'bold',
    },
});