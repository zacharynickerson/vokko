import React, { useEffect, useState } from 'react'
import { Text, View } from 'react-native';

import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function useAuth() {
    const [user, setUser] = useState(null);

    useEffect(()=>{
        const unsub = onAuthStateChanged(auth, user=>{
            console.log('got user: ', user.email);
            if(user){
                setUser(user);
            }else{
                setUser(null);
            }
        });
        return unsub;
    },[])

    return { user }
}