import { useState, useEffect, useCallback } from 'react';
import { auth, createUser, updateUser as updateUserInDB } from '../config/firebase';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      console.log("Auth state changed:", authUser ? "User exists" : "No user");
      setUser(authUser);
      setReady(true);
    });

    return unsubscribe;
  }, []);
  

  const signUp = useCallback(async (email, password, name) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Get the user's photo URL from their auth profile
    const photoURL = userCredential.user.photoURL || null;
    
    // Update the user's display name in Firebase Auth
    await updateProfile(userCredential.user, {
      displayName: name,
      photoURL
    });
    
    // Save user data to Realtime Database
    await createUser(userCredential.user.uid, { 
      email, 
      name,
      photoURL
    });
    
    setUser(userCredential.user);
  }, []);

  const signIn = useCallback(async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    setUser(userCredential.user);
  }, []);

  const logOut = useCallback(async () => {
    await signOut(auth);
    setUser(null);
  }, []);

  return { user, ready, signUp, signIn, logOut };
}