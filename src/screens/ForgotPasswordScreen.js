import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { ArrowLeftIcon } from 'react-native-heroicons/solid';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        'Password Reset Email Sent',
        'Please check your email to reset your password.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      let errorMessage = 'An error occurred while sending the password reset email.';
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'There is no user record corresponding to this email.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'The email address is not valid.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many unsuccessful attempts. Please try again later.';
          break;
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <ArrowLeftIcon size={24} color="black" />
      </TouchableOpacity>
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>Enter your email address to reset password.</Text>
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
            autoCapitalize="none"
          />
        </View>
        <TouchableOpacity 
            style={[styles.resetButton, isLoading && styles.disabledButton]} 
            onPress={handleResetPassword}
            disabled={isLoading}
            >
            <Text style={styles.resetButtonText}>
                {isLoading ? 'Sending...' : 'Reset Password'}
            </Text>
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
  disabledButton: {
    backgroundColor: '#A0A0A0',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
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
  inputContainer: {
    marginBottom: 15,
    marginHorizontal: 20,
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
  resetButton: {
    backgroundColor: '#4FBF67',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  resetButtonText: {
    fontFamily: 'DM Sans',
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
