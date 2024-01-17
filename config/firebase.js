import { getReactNativePersistence, initializeAuth } from 'firebase/auth';

import AsyncStorage from "@react-native-async-storage/async-storage";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBVWVsTVx5i9TtQCgwgobQA-Q4Ik_oWO14",
  authDomain: "vokko-f8f6a.firebaseapp.com",
  projectId: "vokko-f8f6a",
  storageBucket: "vokko-f8f6a.appspot.com",
  messagingSenderId: "793156853153",
  appId: "1:793156853153:web:be691c6433e8db4bcd7fe0",
  measurementId: "G-8M4V4D26CG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Firebase
export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = initializeAuth(FIREBASE_APP, {
    persistence: getReactNativePersistence(AsyncStorage),
});

export const auth = getAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});