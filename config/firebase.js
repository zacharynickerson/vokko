import 'firebase/storage';

import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';

import AsyncStorage from "@react-native-async-storage/async-storage";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase } from 'firebase/database';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyBVWVsTVx5i9TtQCgwgobQA-Q4Ik_oWO14",
  authDomain: "vokko-f8f6a.firebaseapp.com",
  databaseURL: "https://vokko-f8f6a-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "vokko-f8f6a",
  storageBucket: "vokko-f8f6a.appspot.com",
  messagingSenderId: "793156853153",
  appId: "1:793156853153:web:be691c6433e8db4bcd7fe0",
  measurementId: "G-8M4V4D26CG"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

const db = getDatabase();
// Get a reference to the storage service, which is used to create references in your storage bucket
const storage = getStorage();

// Function to upload audio file to Firebase Storage
const uploadAudioFile = async (uri) => {
  try {
    // Fetch the audio file as a blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Generate a unique filename for the uploaded audio
    const filename = uri.split('/').pop();

    // Get a reference to the storage location (adjust the path as needed)
    const storageRef = ref(storage, `audio/${filename}`);

    // Upload the blob to Firebase Storage
    const snapshot = await uploadBytes(storageRef, blob);

    // Log the upload success and get the download URL
    console.log('Upload successful!', snapshot);

    const downloadURL = await getDownloadURL(storageRef);
    
    console.log('Download URL:', downloadURL);

    // Return the download URL or any other relevant information
    return downloadURL;
  } catch (error) {
    console.error('Error uploading audio file:', error);
    throw error; // Rethrow the error for handling in the calling function
  }
};


export default uploadAudioFile;

// ... (rest of your Firebase initialization code)

// Initialize Firebase
// export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
});

export const auth = getAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export { db, storage };
