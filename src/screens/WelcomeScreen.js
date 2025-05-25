import React, { useCallback, useState, useEffect } from 'react'
import { Image, SafeAreaView, Text, TouchableOpacity, View, StyleSheet, Dimensions } from 'react-native'
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useFonts, Lacquer_400Regular } from '@expo-google-fonts/lacquer';
import * as SplashScreen from 'expo-splash-screen';

  

// Define color constants
const COLORS = {
    accentGrey: 'rgba(0, 0, 0, 0.5)', // #000000 with 50% opacity
    alertSuccess: '#4FBF67',
    mainDark: '#1B1D21',
    mainDisable: '#D9D9D9',
  };

  const { width, height } = Dimensions.get('window');

const WelcomeScreen = () => {
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.container}>
            <Image
                source={require('../../assets/images/welcome-background.png')}
                style={[StyleSheet.absoluteFill, { width, height }]}
                resizeMode="cover"
                fadeDuration={0}
            />
            <View style={styles.centerContent}>
                <Image
                    source={require('../../assets/images/welcome-mascot.png')}
                    style={styles.mascotImage}
                    resizeMode="contain"
                />
                <Image
                    source={require('../../assets/images/rambull-logo-white.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                />
                <Text style={styles.subtitle}>Pocket Scribe</Text>
            </View>
            <View style={styles.buttonSection}>
                <TouchableOpacity 
                    style={styles.signupButton} 
                    onPress={() => navigation.navigate('SignUp')}
                >
                    <Text style={styles.buttonText}>Signup</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.loginButton} 
                    onPress={() => navigation.navigate('Login')}
                >
                    <Text style={styles.loginButtonText}>Log in</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
        justifyContent: 'flex-end',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
    },
    mascotImage: {
        width: 344,
        height: 344,
        marginBottom: 8,
    },
    logoImage: {
        width: 260,
        height: 70,
        marginTop: -32,
        marginBottom: 0,
    },
    subtitle: {
        color: 'white',
        fontSize: 22,
        fontFamily: 'Lacquer_400Regular', // Use your app's subtitle font
        textAlign: 'center',
        marginTop: -8,
        marginBottom: 8,
        letterSpacing: 1.2,
    },
    buttonSection: {
        alignItems: 'center',
        marginBottom: 40,
        zIndex: 2,
    },
    signupButton: {
        backgroundColor: '#4FBF67',
        width: '80%',
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
        marginBottom: 10,
    },
    loginButton: {
        backgroundColor: '#FFF',
        width: '80%',
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#4FBF67',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    loginButtonText: {
        color: '#4FBF67',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default WelcomeScreen;