import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getDatabase, ref, set, get, push, update, query, orderByChild } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import AsyncStorage from "@react-native-async-storage/async-storage";

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

// Initialize services
export const db = getDatabase(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Helper function to call Cloud Functions
export const callFunction = (name, data) => {
  const func = httpsCallable(functions, name);
  return func(data);
};

// User operations
export const createUser = async (userId, userData) => {
  const userRef = ref(db, `users/${userId}`);
  await set(userRef, {
    ...userData,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(), // Added lastLoginAt
    settings: {
      notifications: true,
    }
  });
};

export const updateUser = async (userId, updates) => {
  const userRef = ref(db, `users/${userId}`);
  await update(userRef, updates);
};

// Voice Note operations
export const createVoiceNote = async (userId, voiceNoteData) => {
  const voiceNotesRef = ref(db, `voiceNotes/${userId}`);
  const newVoiceNoteRef = push(voiceNotesRef);
  const voiceNoteId = newVoiceNoteRef.key;

  await set(newVoiceNoteRef, {
    ...voiceNoteData,
    voiceNoteId,
    createdDate: new Date().toISOString(),
  });

  return voiceNoteId;
};

export const getVoiceNotes = async (userId) => {
  const voiceNotesRef = ref(db, `voiceNotes/${userId}`);
  const snapshot = await get(voiceNotesRef);
  return snapshot.val();
};

export const updateVoiceNote = async (userId, voiceNoteId, updates) => {
  const voiceNoteRef = ref(db, `voiceNotes/${userId}/${voiceNoteId}`);
  await update(voiceNoteRef, updates);
};

// Module operations
export const getModule = async (moduleId) => {
  const moduleRef = ref(db, `modules/${moduleId}`);
  const snapshot = await get(moduleRef);
  return snapshot.val();
};

export const getModules = async () => {
  const modulesRef = ref(db, 'modules');
  const snapshot = await get(modulesRef);
  const modules = {};
  snapshot.forEach((childSnapshot) => {
    modules[childSnapshot.key] = {
      id: childSnapshot.key,
      ...childSnapshot.val()
    };
  });
  return modules;
};

// Coach operations
export const getCoach = async (coachId) => {
  const coachRef = ref(db, `coaches/${coachId}`);
  const snapshot = await get(coachRef);
  return snapshot.val();
};

export const getCoaches = async () => {
  const coachesRef = ref(db, 'coaches');
  const snapshot = await get(coachesRef);
  return snapshot.val();
};

export const getModuleWithCoach = async (moduleId) => {
  try {
    const module = await getModule(moduleId);
    if (module && module.coachId) {
      const coach = await getCoach(module.coachId);
      return { ...module, id: moduleId, coach: { ...coach, id: module.coachId } };
    }
    console.error('Module or coachId not found', { moduleId, module });
    return null;
  } catch (error) {
    console.error('Error in getModuleWithCoach:', error);
    return null;
  }
};

// Function to upload audio file to Firebase Storage
export const saveToFirebaseStorage = async (base64Data, filePath) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User is not authenticated');
    
    console.log('Creating blob from base64 data...');
    const blob = await fetch(`data:audio/m4a;base64,${base64Data}`).then(r => r.blob());
    console.log('Blob created. Size:', blob.size);
    
    // Ensure the path is constructed correctly
    const audioStorageRef = storageRef(storage, filePath);
    console.log('Storage reference created:', audioStorageRef.fullPath);

    console.log('Starting upload to Firebase Storage...');
    const snapshot = await uploadBytes(audioStorageRef, blob);
    console.log('Upload successful. Bytes transferred:', snapshot.bytesTransferred);

    console.log('Getting download URL...');
    const downloadUrl = await getDownloadURL(audioStorageRef);
    console.log('Download URL obtained:', downloadUrl);

    return downloadUrl;
  } catch (error) {
    console.error('Error in saveToFirebaseStorage:', error);
    if (error.code) {
      console.error('Firebase error code:', error.code);
    }
    if (error.serverResponse) {
      console.error('Server response:', error.serverResponse);
    }
    throw error;
  }
};

// Export necessary Firebase instances and functions
export { httpsCallable };
