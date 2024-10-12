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

  const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
    const navigation = useNavigation();

    return (
        <LinearGradient
          colors={[COLORS.alertSuccess, '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.2816 }}
          style={styles.container}
        >
        <SafeAreaView style={styles.content}>
        <View style={styles.topSection}>
          <View style={styles.dailyStandupCard}>
            <Text style={styles.cardTitle}>Daily Standup</Text>
            <Image
              source={require('/Users/zacharynickerson/Desktop/vokko/assets/images/avatar-welcome.png')}
              style={styles.avatar}
            />
            <Svg height="100%" width="100%" style={styles.decorativeLines}>
              <Path
                d="M0 60 Q60 40, 120 90 T240 120"
                fill="none"
                stroke="#E0E0E0"
                strokeWidth="1"
              />
              <Path
                d="M0 80 Q60 60, 120 110 T240 140"
                fill="none"
                stroke="#E0E0E0"
                strokeWidth="1"
              />
            </Svg>
            <View style={styles.controlsContainer}>
              <View style={styles.pauseButton}>
                <Svg height="24" width="24" viewBox="0 0 24 24">
                  <Circle cx="12" cy="12" r="10" stroke={COLORS.mainDark} strokeWidth="2" fill="none" />
                  <Path d="M10 8 V16 M14 8 V16" stroke={COLORS.mainDark} strokeWidth="2" />
                </Svg>
              </View>
              <View style={styles.phoneButton}>
                <Svg height="24" width="24" viewBox="0 0 24 24">
                  <Circle cx="12" cy="12" r="12" fill={COLORS.alertSuccess} />
                  <G transform="translate(12, 12) rotate(130) translate(-12, -12) translate(4, 4) scale(0.67)">
                    <Path
                      d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1.02 1.02 0 00-1.02.24l-2.2 2.2a15.045 15.045 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1A11.36 11.36 0 018.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1zM5.03 5h1.5c.07.89.22 1.76.46 2.59l-1.2 1.2c-.41-1.2-.67-2.47-.76-3.79zM19 18.97c-1.32-.09-2.59-.35-3.8-.75l1.19-1.19c.85.24 1.72.39 2.6.45v1.49z"
                      fill={COLORS.mainDark}
                    />
                  </G>
                </Svg>
              </View>
            </View>
          </View>
          
          <View style={styles.sessionScheduledCard}>
            <Image
              source={require('/Users/zacharynickerson/Desktop/vokko/assets/images/success-confetti-welcome.png')}
              style={styles.confettiImage}
            />
            <Text style={styles.cardTitle}>Session Scheduled</Text>
          </View>
        </View>

        {/* Welcome to Vokko Card */}
        <View style={styles.welcomeCard}>
          <View style={styles.guidedButton}>
            <Text style={styles.guidedButtonText}>Guided</Text>
          </View>
          <View style={styles.welcomeTextContainer}>
            <Text style={styles.welcomeCardTitle}>Welcome to Vokko</Text>
            <Text style={styles.welcomeCardDate}>Friday, Dec 11, 2024</Text>
          </View>
        </View>

        <View style={styles.vavatarContainer}>
          <Image
            source={require('/Users/zacharynickerson/Desktop/vokko/assets/images/Avatar Male 7.png')}
            style={[styles.vavatar, styles.vavatar1]}
          />
          <Image
            source={require('/Users/zacharynickerson/Desktop/vokko/assets/images/Avatar Male 11.png')}
            style={[styles.vavatar, styles.vavatar2]}
          />
          <Image
            source={require('/Users/zacharynickerson/Desktop/vokko/assets/images/Avatar Male 2.png')}
            style={[styles.vavatar, styles.vavatar3]}
          />
          <Image
            source={require('/Users/zacharynickerson/Desktop/vokko/assets/images/Avatar Female 6.png')}
            style={[styles.vavatar, styles.vavatar4]}
          />
          <Image
            source={require('/Users/zacharynickerson/Desktop/vokko/assets/images/Avatar Male 3.png')}
            style={[styles.vavatar, styles.vavatar5]}
          />
        </View>

        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome to Vokko</Text>
          <Text style={styles.welcomeSubtitle}>Transform ideas into structured notes</Text>
        </View>

        <View style={styles.buttonSection}>
          <TouchableOpacity 
            style={styles.signupButton} 
            onPress={() => navigation.navigate('SignUpScreen')}
          >
            <Text style={styles.buttonText}>Signup</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={() => navigation.navigate('LoginScreen')}
          >
            <Text style={styles.loginButtonText}>Log in</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
    
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        paddingTop: 180, // Increase this value to move everything down
    },
    content: {
        flex: 1,
        padding: 20,
        justifyContent: 'space-between',
    },
    topSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 10, // Reduce this to bring cards closer together
      },
      avatar: {
        width: 90,
        height: 90,
        borderRadius: 35,
        // position: 'absolute',
        // top: 30,
        // // left: 25,
        zIndex: 2,
    },
    dailyStandupCard: {
        width: 125,
        height: 157,
        borderRadius: 15,
        backgroundColor: '#FFF',
        alignItems: 'center',
        transform: [{ rotate: '-4deg' }],
        zIndex: 2,
        shadowColor: "#000",
        shadowOffset: {
        width: 0,
        height: 10,
        },
        shadowOpacity: 0.10,
        shadowRadius: 12,
        elevation: 15,
        paddingTop: 10,
    },
    sessionScheduledCard: {
        backgroundColor: '#FFF',
        borderRadius: 15, // Increased for smooth, rounded corners
        padding: 20,
        paddingBottom: 20,
        width: 170,
        height: 138,
        left: 15, // Adjust as needed
        top: 15,   // Adjust as needed
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 }, // Drop shadow from the light source above
        shadowOpacity: 0.10,
        shadowRadius: 20, // Bigger radius for a softer shadow spread
        elevation: 15, // Enhanced elevation for Android
        alignSelf: 'center', // Center the card horizontally
        boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.15)', // Mimic web styling for depth
        transform: [{ rotate: '4deg' }],
        zIndex: 1,
        padding: 10,

    },
    cardTitle: {
        fontFamily: 'DM Sans',
        fontSize: 14,
        fontWeight: 'bold',
        fontSize: 16,
        textAlign: 'center',
    },
    welcomeCard: {
        backgroundColor: '#FFF',
        borderRadius: 25, // Increased for heavy radial corners
        padding: 20,
        width: 300,
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20, // Added to center the card
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 20,
        alignSelf: 'center', // This will center the card horizontally
        boxShadow: '0px 4px 15px 0px rgba(0, 0, 0, 0.1)',
      },
      welcomeCardTitle: {
        fontFamily: 'DM Sans',
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 10,
        width: '100%', // Ensure text takes full width of the card
      },
      guidedButton: {
        backgroundColor: COLORS.alertSuccess,
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 15,
        marginRight: 10,
      },
      guidedButtonText: {
        color: '#FFF',
        fontSize: 10,
        fontFamily: 'DMSans-Semibold',
        fontWeight: '900',
      },
      welcomeTextContainer: {
        flex: 1,
      },
      welcomeCardDate: {
        fontFamily: 'DMSans',
        fontSize: 10.5,
        fontWeight: '400',
        color: '#808080',
        marginLeft: 10,
      },
    vavatarContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        // marginVertical: 0,
      },
      vavatar: {
        width: 80,
        height: 80,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: 'white',
      },
      vavatar1: { zIndex: 5 },
      vavatar2: { marginLeft: -15, zIndex: 4 },
      vavatar3: { marginLeft: -15, zIndex: 3 },
      vavatar4: { marginLeft: -15, zIndex: 2 },
      vavatar5: { marginLeft: -15, zIndex: 1 },
    decorativeLines: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
    },
    controlsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: 10,
        left: 0,
        right: 0,
        zIndex: 2,
    },
    pauseButton: {
        marginRight: 2, // Negative margin to pull buttons closer
    },
    phoneButton: {
        marginLeft: 2, // Negative margin to pull buttons closer
    },
    confettiImage: {
        width: 80,
        height: 80,
        marginBottom: 10,
    },
    welcomeSection: {
        alignItems: 'center',
        marginVertical: 20,
    },
    welcomeTitle: {
        fontFamily: 'DMSans-Bold',
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.mainDark,
        marginBottom: 10,
    },
    welcomeSubtitle: {
        fontFamily: 'DMSans',
        fontSize: 16,
        color: '#808080',
        textAlign: 'center',
    },
    buttonSection: {
        alignItems: 'center',
    },
    signupButton: {
        backgroundColor: COLORS.alertSuccess,
        width: width * 0.8,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
        marginBottom: 10,
    },
    loginButton: {
        backgroundColor: 'transparent',
        width: width * 0.8,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    loginButtonText: {
        color: COLORS.alertSuccess,
        fontWeight: 'bold',
        fontSize: 16,
    },
  });