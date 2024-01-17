import 'react-native-gesture-handler'

import React, { useEffect } from 'react'
import { SafeAreaView, Text, View } from 'react-native'

import AppNavigation from '/Users/zacharynickerson/VokkoApp/src/navigation/appNavigation.js';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { apiCall } from './src/api/openAI';

export default function App() {
    useEffect(()=>{
    }, [])
    return (
        <GestureHandlerRootView style={{ flex: 1}}>
            <AppNavigation />
        </GestureHandlerRootView>
    )
}