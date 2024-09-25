import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getDatabase, ref, set } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions'; // Add this line
import AsyncStorage from "@react-native-async-storage/async-storage";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';


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
const db = getDatabase(app);
const storage = getStorage(app);
const functions = getFunctions(app); // Add this line

// Helper function to call Cloud Functions
const callFunction = (name, data) => {
  const func = httpsCallable(functions, name);
  return func(data);
};


// Initialize Firebase Authentication
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
// Initialize Firebase Authentication
// export const FIREBASE_AUTH = initializeAuth(app, {
//   persistence: getReactNativePersistence(AsyncStorage),
// });

// // Get Firebase Authentication instance
// export const auth = getAuth(app, {
//   persistence: getReactNativePersistence(ReactNativeAsyncStorage)
// });


// Function to upload audio file to Firebase Storage
const saveToFirebaseStorage = async (uri, voiceNoteId) => {
  try {
    // Ensure user is authenticated
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User is not authenticated');
    }
    // Fetch the audio file as a blob
    const response = await fetch(uri);
    const blob = await response.blob();
    

    // Use voiceNoteId as the filename
    const filename = `${voiceNoteId}.m4a`; // or any other extension

    // Get user's UID
    const userId = user.uid;

    // Get a reference to the storage location (adjust the path as needed)
    const audioStorageRef = storageRef(storage, `users/${userId}/voiceNotes/${filename}`);

    // Upload the blob to Firebase Storage
    await uploadBytes(audioStorageRef, blob);

    // Log the upload success and get the download URL
    console.log('Officially done uploading to Firebase Storage!');

    const downloadURL = await getDownloadURL(audioStorageRef);

    console.log('Download URL:', downloadURL);

    // Return the download URL or any other relevant information
    return downloadURL;
  } catch (error) {
    console.error('Error uploading audio file:', error);
    throw error; // Rethrow the error for handling in the calling function
  }
};



// Function to save the voice note data to Firebase Realtime Database
export const saveToFirebaseDatabase = async (userId, voiceNote) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User is not authenticated');
    }

    // Remove any properties with undefined values
    const cleanVoiceNote = Object.fromEntries(
      Object.entries(voiceNote).filter(([_, v]) => v !== undefined)
    );

    const databaseRef = ref(db, `users/${userId}/voiceNotes/${voiceNote.voiceNoteId}`);
    await set(databaseRef, cleanVoiceNote);

    console.log('Data saved to Firebase Realtime Database');
  } catch (error) {
    console.error('Error saving data to Firebase:', error);
    throw error;
  }
};

// Function to save conversation to Firebase Realtime Database
// export const saveConversationToFirebase = async (roomName, messages) => {
//   try {
//     const user = auth.currentUser;
//     if (!user) {
//       throw new Error('User is not authenticated');
//     }

//     const conversationData = {
//       userId: user.uid,
//       roomName: roomName,
//       messages: messages,
//       timestamp: new Date().toISOString()
//     };

//     const databaseRef = ref(db, `conversations/${roomName}`);
//     await set(databaseRef, conversationData);

//     console.log('Conversation saved to Firebase Realtime Database');
//   } catch (error) {
//     console.error('Error saving conversation to Firebase:', error);
//     throw error;
//   }
// };


// Export necessary Firebase instances and functions
export { db, storage, functions, httpsCallable };