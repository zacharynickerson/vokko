import React, { useCallback, useState, useEffect } from 'react'
import { Image, SafeAreaView, Text, TouchableOpacity, View, StyleSheet, Dimensions } from 'react-native'
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useFonts, Lacquer_400Regular } from '@expo-google-fonts/lacquer';
import * as SplashScreen from 'expo-splash-screen';
import { FirebaseImage } from '../components/FirebaseImage';
import { useTheme } from '../contexts/ThemeContext';
  

// Define color constants
const COLORS = {
    accentGrey: 'rgba(0, 0, 0, 0.5)', // #000000 with 50% opacity
    alertSuccess: '#4FBF67',
    mainDark: '#1B1D21',
    mainDisable: '#D9D9D9',
  };

  const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
    const navigation = useNavigation();
    const theme = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <FirebaseImage
                source="ui/success-confetti-welcome.png"
                style={styles.welcomeImage}
                resizeMode="contain"
            />
            <Text style={[styles.title, { color: theme.colors.text }]}>
                Welcome to Vokko!
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                Your personal AI language learning companion
            </Text>
            <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
                onPress={() => navigation.navigate('Login')}
            >
                <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
        </View>
    );
}
    
const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    welcomeImage: {
        width: '80%',
        height: 200,
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 30,
        textAlign: 'center',
    },
    button: {
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 25,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});