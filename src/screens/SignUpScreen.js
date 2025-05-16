import React, { useState } from 'react';
import { Image, Text, TextInput, TouchableOpacity, View, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeftIcon } from 'react-native-heroicons/solid';
import { useNavigation } from '@react-navigation/native';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import useAuth from '../../hooks/useAuth';
import { auth, createUser, db, functions, storage} from '../../config/firebase';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { statusCodes } from '@react-native-google-signin/google-signin';

export default function SignUpScreen() {
    const navigation = useNavigation();
    const { signUp } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [showMoreOptions, setShowMoreOptions] = useState(false);
    const [showEmailSignup, setShowEmailSignup] = useState(false);


    const handleEmailSignUp = async () => {
        setLoading(true);
        try {
            await signUp(email, password, name);
            navigation.navigate('Onboarding');
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
            navigation.navigate('Onboarding');
        } catch (error) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED || error.message?.includes('canceled') || error.message?.includes('cancelled')) {
                return;
            }
            console.error("Google Sign-Up error:", error);
            showCustomAlert('Google Sign-Up Error', 'An error occurred during Google sign-up. Please try again.');
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
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                    <View style={styles.content}>
                        <View style={styles.headerContainer}>
                            <Text style={styles.title}>Welcome</Text>
                            <Text style={styles.subtitle}>Create an account to get started.</Text>
                        </View>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={[styles.button, styles.googleButton]} onPress={handleGoogleSignUp}>
                                <Image source={require('../../assets/images/google.png')} style={styles.buttonIcon} />
                                <Text style={styles.buttonText}>Sign up with Google</Text>
                            </TouchableOpacity>

                            {!showMoreOptions && !showEmailSignup && (
                                <TouchableOpacity style={[styles.button, { backgroundColor: '#F3F8FE' }]} onPress={() => setShowMoreOptions(true)}>
                                    <Text style={styles.buttonText}>Show more options</Text>
                                </TouchableOpacity>
                            )}

                            {(showMoreOptions || showEmailSignup) && (
                                <>
                                    {!showEmailSignup && (
                                        <TouchableOpacity style={[styles.button, { backgroundColor: '#F9FAFA' }]} onPress={() => setShowEmailSignup(true)}>
                                            <View style={styles.emailIcon}>
                                                <Text style={styles.emailIconText}>✉️</Text>
                                            </View>
                                            <Text style={styles.buttonText}>Sign up with Email</Text>
                                        </TouchableOpacity>
                                    )}
                                </>
                            )}
                        </View>

                        {showEmailSignup && (
                            <View style={styles.emailSignupContainer}>
                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>Name</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Your name"
                                        placeholderTextColor="#999"
                                        value={name}
                                        onChangeText={setName}
                                    />
                                </View>
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
                    </View>
                </ScrollView>
                <View style={styles.loginPromptContainer}>
                    <Text style={styles.loginPromptText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
                        <Text style={styles.loginLink}>Login</Text>
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
    googleButton: {
        backgroundColor: '#E6F6FE',
    },
    moreOptionsText: {
        fontFamily: 'DM Sans',
        color: '#4FBF67',
        fontWeight: 'bold',
    },
});
