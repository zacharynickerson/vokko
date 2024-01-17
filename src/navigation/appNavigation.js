import * as React from 'react';

import {Text, View} from 'react-native';

import { Entypo } from "@expo/vector-icons"
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import HomeScreen from '../screens/RecordScreen';
import LibraryScreen from '../screens/LibraryScreen';
import LoginScreen from '../screens/LoginScreen';
import {NavigationContainer} from '@react-navigation/native';
import SettingsScreen from '../screens/SettingsScreen';
import SignUpScreen from '../screens/SignUpScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import useAuth from '/Users/zacharynickerson/VokkoApp/hooks/useAuth.js'

const Tab =createBottomTabNavigator();
const screenOptions ={
    tabBarShowLabel:false,
    headerShown:false,
    tabBarStyle:{
        position: "absolute",
        bottom: 0,
        right: 0,
        left: 0,
        elevation: 0,
        height: 60,
        background: "#1F222A",
    }
}


//----------------------------------------
const Stack = createNativeStackNavigator();

export default function AppNavigation() {
const {user} = useAuth();

React.useEffect(()=>{
      }, [])

  if(user){
    return (
      // <NavigationContainer>
      //   <Stack.Navigator  initialRouteName='HomeScreen'>
      //     <Stack.Screen name="HomeScreen" options={{headerShown: false}} component={HomeScreen} />
      //     <Stack.Screen name="LibraryScreen" options={{headerShown: false}} component={LibraryScreen} />
      //     <Stack.Screen name="SettingsScreen" options={{headerShown: false}} component={SettingsScreen} />
      //   </Stack.Navigator>
      // </NavigationContainer>

      <NavigationContainer >
        <Tab.Navigator screenOption={screenOptions} initialRouteName='HomeScreen' >
            <Tab.Screen 
            name="Library" 
            component={LibraryScreen} 
            options={{
              tabBarIcon: ({focused})=>{
                return (
                <View style={{alignItems: "center", justifyContent: "center"}}>
                  <Entypo name="list" size={24} color={focused ? "#FFF": "#8B8B8B"} />
                </View>
                )
              },
              headerShown: false, 
              tabBarShowLabel:false,
              tabBarStyle: { backgroundColor: "#1F222A" }, // Set background color here
            }} 
            
            />
            <Tab.Screen 
            name="Record" 
            component={HomeScreen} 
            options={{
              tabBarIcon: ({focused})=>{
                return (
                <View 
                  style={{
                    top: Platform.OS == "ios" ? 0 : 0,
                    width: Platform.OS == "ios" ? 60 : 50,
                    height: Platform.OS == "ios" ? 60 : 50,
                    borderRadius: Platform.OS == "ios" ? 25 : 30,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#FFF",
                    }}
                  >
                  <Entypo name="plus" size={24} color={focused ? "#1F222A": "#8B8B8B"} />
                </View>
                )
              },
              headerShown: false, 
              tabBarShowLabel:false,
              tabBarStyle: { backgroundColor: "#1F222A" },
             }} 
            />
            <Tab.Screen 
            name="Settings" 
            component={SettingsScreen} 
            options={{
              tabBarIcon: ({focused})=>{
                return (
                <View style={{alignItems: "center", justifyContent: "center"}}>
                  <Entypo name="cog" size={24} color={focused ? "#FFF": "#8B8B8B"} />
                </View>
                )
              },
              headerShown: false, 
              tabBarShowLabel:false,
              tabBarStyle: { backgroundColor: "#1F222A" }, }} 
            />
        </Tab.Navigator>
      </NavigationContainer>

    
      
    )
  }else{
    return (
      <NavigationContainer>
        <Stack.Navigator initialRouteName='WelcomeScreen'>
          <Stack.Screen name="WelcomeScreen" options={{headerShown: false}} component={WelcomeScreen} />
          <Stack.Screen name="LoginScreen" options={{headerShown: false}} component={LoginScreen} />
          <Stack.Screen name="SignUpScreen" options={{headerShown: false}} component={SignUpScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }
}

// ----------------------------------------

// export default function App() {
//     useEffect(()=>{
//     }, [])
    // return (
            // <NavigationContainer>
            //     <Tab.Navigator screenOption={screenOptions}>
            //         <Tab.Screen name="LibraryScreen" component={LibraryScreen} />
            //         <Tab.Screen name="HomeScreen" component={HomeScreen} />
            //         <Tab.Screen name="SettingsScreen" component={SettingsScreen} />
            //     </Tab.Navigator>
            // </NavigationContainer>

    // )
// }