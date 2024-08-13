import React from 'react';
import { View, Alert } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

export default function AppleSignIn() {
  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      // signed in
      console.log(credential);
      // Here you would typically send the credential to your server or use it to sign in to Firebase
    } catch (e) {
      if (e.code === 'ERR_CANCELED') {
        // handle that the user canceled the sign-in flow
        Alert.alert('Sign in canceled');
      } else {
        // handle other errors
        console.error(e);
        Alert.alert('An error occurred during sign in');
      }
    }
  };

  return (
    <View>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={5}
        style={{ width: 200, height: 44 }}
        onPress={handleAppleSignIn}
      />
    </View>
  );
}