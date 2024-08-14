import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getDatabase, ref, set } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

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
const saveToFirebaseDatabase = async (userId, voiceNote, downloadUrl) => {
    try {
          const user = auth.currentUser;
          if (!user) {
            throw new Error('User is not authenticated');
          }
    
          const userId = user.uid;
          const voiceNoteData = {
            ...voiceNote,
            uri: downloadUrl // Replace local URI with Firebase Storage URL
          };
      
          const databaseRef = ref(db, `users/${userId}/voiceNotes/${voiceNote.voiceNoteId}`);
          await set(databaseRef, voiceNoteData);
      
          console.log('Data saved to Firebase Realtime Database');
        } catch (error) {
          console.error('Error saving data to Firebase:', error);
          throw error;
        }
};

// Initialize Firebase Authentication
export const FIREBASE_AUTH = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Get Firebase Authentication instance
export const auth = getAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Export necessary Firebase instances and functions
export { db, storage, saveToFirebaseStorage, saveToFirebaseDatabase };

// import 'firebase/storage';

// import { initializeApp } from 'firebase/app';
// import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
// import { getDatabase } from 'firebase/database';
// import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';

// import AsyncStorage from "@react-native-async-storage/async-storage";
// import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// const firebaseConfig = {
//   apiKey: "AIzaSyBVWVsTVx5i9TtQCgwgobQA-Q4Ik_oWO14",
//   authDomain: "vokko-f8f6a.firebaseapp.com",
//   databaseURL: "https://vokko-f8f6a-default-rtdb.europe-west1.firebasedatabase.app",
//   projectId: "vokko-f8f6a",
//   storageBucket: "vokko-f8f6a.appspot.com",
//   messagingSenderId: "793156853153",
//   appId: "1:793156853153:web:be691c6433e8db4bcd7fe0",
//   measurementId: "G-8M4V4D26CG"
// };
// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const db = getDatabase();
// const storage = getStorage();

// const saveToFirebaseDatabase = async (uri) => {
//   try {
//     // Upload the audio file to Firebase Storage
//     const downloadUrl = await saveToFirebaseStorage(voiceNote.uri);
//     console.log('Successfully uploaded to Firebase Storage:', downloadUrl);

//     // Save the voice note data to Firebase Realtime Database
//     const user = auth.currentUser;
//     if (!user) {
//       throw new Error('User is not authenticated');
//     }

//     const userId = user.uid;
//     const voiceNoteData = {
//       ...voiceNote,
//       uri: downloadUrl // Replace local URI with Firebase Storage URL
//     };

//     const databaseRef = ref(db, `voiceNotes/${userId}/${voiceNote.voiceNoteId}`);
//     await set(databaseRef, voiceNoteData);

//     console.log('Data saved to Firebase Realtime Database');
//   } catch (error) {
//     console.error('Error saving data to Firebase:', error);
//     throw error;
//   }
// };


// // Function to upload audio file to Firebase Storage
// const saveToFirebaseStorage = async (uri) => {
//   try {
//     // Ensure user is authenticated
//     const user = auth.currentUser;
//     if (!user) {
//       throw new Error('User is not authenticated');
//     }
//     // Fetch the audio file as a blob
//     const response = await fetch(uri);
//     const blob = await response.blob();

//     // Generate a unique filename for the uploaded audio
//     const filename = uri.split('/').pop();

//     // Get user's UID
//     const userId = user.uid;

//     // Get a reference to the storage location (adjust the path as needed)
//     const storageRef = ref(storage, `users/${userId}/voiceNotes/${filename}`);

//     // Upload the blob to Firebase Storage
//     const snapshot = await uploadBytes(storageRef, blob);

//     // Log the upload success and get the download URL
//     console.log('Officially done uploading to Firebase Storage!');

//     const downloadURL = await getDownloadURL(storageRef);
    
//     console.log('Download URL:', downloadURL);

//     // Return the download URL or any other relevant information
//     return downloadURL;
//   } catch (error) {
//     console.error('Error uploading audio file:', error);
//     throw error; // Rethrow the error for handling in the calling function
//   }
// };


// // Initialize Firebase
// // export const FIREBASE_APP = initializeApp(firebaseConfig);
// export const FIREBASE_AUTH = initializeAuth(app, {
//     persistence: getReactNativePersistence(AsyncStorage),
// });

// export const auth = getAuth(app, {
//   persistence: getReactNativePersistence(ReactNativeAsyncStorage)
// });

// export { db, storage, saveToFirebaseStorage, saveToFirebaseDatabase};
