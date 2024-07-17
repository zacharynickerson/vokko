import { useState, useEffect } from 'react';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user ? "User exists" : "No user");
      setUser(user);
      setReady(true); // Set ready to true once the auth state is determined
    });

    return unsubscribe;
  }, []);

  const updateUser = (user) => {
    setUser(user);
  };

  return { user, ready, updateUser };
}