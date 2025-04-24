import React, { useState, useEffect } from 'react';
import { Image, Text, TextInput, TouchableOpacity, View, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeftIcon } from 'react-native-heroicons/solid';
import { useNavigation } from '@react-navigation/native';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import useAuth from '../../hooks/useAuth';
import { auth, createUser, db, functions, storage} from '../../config/firebase';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';

export default function SignUpScreen() {
    const navigation = useNavigation();
    const { signUp } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [isAppleSignInAvailable, setIsAppleSignInAvailable] = useState(false);
    const [showEmailSignup, setShowEmailSignup] = useState(false);  // Added this line


    const handleEmailSignUp = async () => {
        setLoading(true);
        try {
            await signUp(email, password, name);
            navigation.navigate('Library', { screen: 'LibraryScreen' });
        } catch (err) {
            console.error("Signup error:", err);
            if (err.code === 'auth/email-already-in-use') {
                showCustomAlert('Signup Error', 'This email is already in use. Please login.');
            } else {
                showCustomAlert('Signup Error', err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        try {
            await GoogleSignin.hasPlayServices();
            const { idToken, user } = await GoogleSignin.signIn();
            const googleCredential = GoogleAuthProvider.credential(idToken);
            const userCredential = await signInWithCredential(auth, googleCredential);
            
            await createUser(userCredential.user.uid, {
                name: user.name,
                email: user.email,
                photoURL: user.photo
            });
            
            console.log("User signed up successfully with Google");
            navigation.navigate('Library', { screen: 'LibraryScreen' });
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
            // For this example, we'll assume you have a function to handle Apple sign-in with Firebase
            const userCredential = await signInWithApple(credential);
            
            // Apple doesn't provide a profile photo, so we'll use a default avatar
            const defaultPhotoURL = null; // We'll use the default photo in the UI
            
            await createUser(userCredential.user.uid, {
                name: credential.fullName.givenName + ' ' + credential.fullName.familyName,
                email: credential.email,
                photoURL: defaultPhotoURL
            });
            
            console.log("User signed up successfully with Apple");
            navigation.navigate('Library', { screen: 'LibraryScreen' });
        } catch (error) {
            if (error.code === 'ERR_CANCELED') {
                console.log('User cancelled Apple Sign-In');
            } else {
                console.error("Apple Sign-Up error:", error);
                showCustomAlert('Apple Sign-Up Error', 'An error occurred during Apple sign-up. Please try again.');
            }
        }
    };

    const showCustomAlert = (title, message) => {
        Alert.alert(
            title,
            message,
            [{ text: 'OK', onPress: () => console.log('OK Pressed') }],
            { cancelable: false }
        );
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
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>Welcome</Text>
                    <Text style={styles.subtitle}>Create an account to get started.</Text>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={[styles.button, { backgroundColor: '#E6F6FE' }]} onPress={handleGoogleSignUp}>
                        <Image source={require('../../assets/images/google.png')} style={styles.buttonIcon} />
                        <Text style={styles.buttonText}>Sign up with Google</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.button, { backgroundColor: '#F3F8FE' }]} onPress={handleAppleSignUp}>
                        <Image source={require('../../assets/images/apple-logo-transparent.png')} style={styles.buttonIcon} />
                        <Text style={styles.buttonText}>Sign up with Apple</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.button, { backgroundColor: '#F9FAFA' }]} onPress={() => setShowEmailSignup(true)}>
                        <View style={styles.emailIcon}>
                            <Text style={styles.emailIconText}>✉️</Text>
                        </View>
                        <Text style={styles.buttonText}>Sign up with Email</Text>
                    </TouchableOpacity>
                </View>

                {showEmailSignup && (
                    <View style={styles.emailSignupContainer}>
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
                        <TouchableOpacity 
                            style={[styles.button, styles.signupButton]} 
                            onPress={handleEmailSignUp}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={[styles.buttonText, styles.signupButtonText]}>Signup</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {/* Move the login prompt outside of the scrollable content */}
            </View>
            <View style={styles.loginPromptContainer}>
                <Text style={styles.loginPromptText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
                    <Text style={styles.loginLink}>Login</Text>
                </TouchableOpacity>
            </View>
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
        justifyContent: 'flex-start', // Changed from 'center' to 'flex-start'
    },
    headerContainer: {
        marginTop: 40,
        marginBottom: 30,
        marginHorizontal: 20, // Add this line
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
    emailSignupContainer: {
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
    signupButton: {
        backgroundColor: '#4FBF67',
        justifyContent: 'center',
        marginHorizontal: 0,
    },
    signupButtonText: {
        fontFamily: 'DM Sans',
        color: '#FFF',
        fontWeight: 'bold',
    },
    loginPromptContainer: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    loginPromptText: {
        fontFamily: 'DM Sans',
        color: '#666',
    },
    loginLink: {
        fontFamily: 'DM Sans',
        color: '#4FBF67',
        fontWeight: 'bold',
    },
});
