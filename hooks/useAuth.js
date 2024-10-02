import { useState, useEffect, useCallback } from 'react';
import { auth, createUser, updateUser as updateUserInDB } from '../config/firebase';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';

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
    await createUser(userCredential.user.uid, { email, name });
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