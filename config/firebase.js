import { getReactNativePersistence, initializeAuth } from 'firebase/auth';

import AsyncStorage from "@react-native-async-storage/async-storage";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";

// Your web app's Firebase configuration
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

export const getFirebaseApp = () => app;

export const FIREBASE_AUTH = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
});

export const auth = getAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
