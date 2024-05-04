// Import necessary modules and components from React Native and other libraries
import { Image, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { db, storage } from '../../config/firebase.js'; // Import Firebase configuration
import { get, onValue, ref, set } from 'firebase/database'; // Import Firebase Realtime Database functions
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen'; // Import functions for responsive screen design

import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage for storing data locally
import { Audio } from 'expo-av'; // Import Audio module from Expo for handling audio playback
import { FileSystem } from 'expo-file-system'; // Import FileSystem for file system access
import Playback from "../components/playback.js"; // Import custom Playback component

// import { useNavigation } from '@react-navigation/native';

// Define the functional component VoiceNoteDetails
export default function VoiceNoteDetails({ route }) {

  // Destructure route.params to get voice note attributes
  const { uri, messages, date, month, year } = route.params;
  // Define state variables for note title, transcription, and other attributes
  const [noteTitle, setNoteTitle] = useState('');
  const [transcription, setTranscription] = useState('');
  const [sound, setSound] = useState(null); // Use useState to manage Audio.Sound object
  const [alreadySavedToFBS, setAlreadySavedToFBS] = useState(false); // State variable to track if audio is already saved to Firebase Storage

  const ScrollViewRef = useRef(); // Reference for ScrollView component
  const [parsedExistingNotes] = useState([]); // State variable for existing notes (unused)

  // Function to save the voice note recording to Firebase Storage
  // const saveToFirebaseStorage = async () => {
  //   if (!alreadySavedToFBS) {
  //     const uri = route.params.uri; // Get the URI of the audio file
  //     uploadAudioFile(uri); // Upload the audio file to Firebase Storage
  //     console.log("Successfully uploaded to Firebase Storage");
  //     setAlreadySavedToFBS(true); // Update state to indicate audio saved to Firebase Storage
  //   }
  // };

// Function to save the voice note object to Firebase Realtime Database
const saveToFirebaseDatabase = async (voiceNote) => {
  try {
    // Extract filename from URI to use as key in database
    const databaseURI = voiceNote.uri.split('/').pop();
    const uriKey = databaseURI.replace(/[.#$/[\]]/g, ''); // Clean up the URI to make it a valid key
    
    // Fetch existing voice note data from Firebase to preserve transcription value
    const existingNoteSnapshot = await ref(db, `voiceNotes/${uriKey}`);
    const existingNoteData = (await get(existingNoteSnapshot)).val();

    // Preserve existing transcription value if available
    if (existingNoteData && existingNoteData.transcription) {
      voiceNote.transcription = existingNoteData.transcription;
    }
    
    // Save updated voice note data to Firebase
    await set(ref(db, `voiceNotes/${uriKey}`), voiceNote);
    console.log('Data saved to Firebase Realtime Database');
    console.log(route.params.uri)
    saveAudioToFileSystem();
  } catch (error) {
    console.error('Error saving data to Firebase:', error);
  }
};
        
// Debounce the saveAsyncData function to avoid saving for every character typed
const debounceSave = useRef(null);

// Debounce saving changes in noteTitle and parsedExistingNotes
useEffect(() => {
    clearTimeout(debounceSave.current);
    debounceSave.current = setTimeout(() => {
      // Save data to Firebase Database and Firebase Storage
      saveToFirebaseDatabase({
        date: route.params.date,
        month: route.params.month,
        year: route.params.year,
        uri: route.params.uri,
        messages: messages,
        transcription: transcription,
        noteTitle: noteTitle || `Recording ${parsedExistingNotes.length + 1}`,
      });
      // saveToFirebaseStorage(); // Save to Firebase Storage only once
    }, 500); // Adjust the delay as needed (e.g., 500 milliseconds)
  }, [noteTitle, parsedExistingNotes]);
  
  // When the component mounts, set the noteTitle from route.params
  useEffect(() => {
    setNoteTitle(route.params.noteTitle || `Recording ${parsedExistingNotes.length + 1}`);
  }, [route.params.noteTitle, parsedExistingNotes]);

  useEffect(() => {
    const databaseURI = route.params.uri.split('/').pop();
    const uriKey = databaseURI.replace(/[.#$/[\]]/g, '');
    const transcriptionRef = ref(db, `voiceNotes/${uriKey}/transcription`);

    const unsubscribe = onValue(transcriptionRef, (snapshot) => {
      const updatedTranscription = snapshot.val();
      setTranscription(updatedTranscription || '');
    });

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
      if (sound) {
        console.log('Unloading Sound');
        sound.unloadAsync(); // Unload audio when component unmounts
      }
    };
  }, [route.params.uri, sound]);

  useEffect(() => {
    const loadSound = async () => {
      try {
        console.log('Loading Sound');
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { progressUpdateIntervalMillis: 1000 / 60 },
          onPlaybackStatusUpdate
        );
        setSound(sound);
        console.log("loaded uri", uri);
      } catch (error) {
        console.error('Error loading sound:', error);
      }
    };
  
    loadSound();
  
    // Clean up function to unload audio when component unmounts
    return () => {
      if (sound) { // Check if sound is not null before accessing it
        console.log('Unloading Sound');
        sound.unloadAsync();
      }
    };
  }, [uri]); // Dependency on uri to reload sound when it changes
  

  // // Callback function for playback status update
  // const onPlaybackStatusUpdate = useCallback(async (newStatus) => {
  //   // Handle playback status update here if needed
  // }, []);

    // Callback function for playback status update
    const onPlaybackStatusUpdate = async (newStatus) => {
      // Handle playback status update here if needed
    };
  

    const saveAudioToFileSystem = async () => {
      try {
        const { uri } = route.params; // Get the URI of the audio file
    
        // Ensure FileSystem is available
        if (!FileSystem) {
          console.log('FileSystem nope');
          return;
        }
    
        const filename = uri.split('/').pop(); // Extract filename from URI
    
        // Get document directory path asynchronously
        const { directory } = await FileSystem.documentDirectoryAsync();
        const fileUri = `${directory}/${filename}`;
    
        // ... rest of your existing logic to copy the file and update state
      } catch (error) {
        console.error('Error saving audio to file system:', error);
      }
    };


  // Function to save the voice note recording to AsyncStorage
  // const saveToAsyncStorage = async () => {
  //   try {
  //     const uri = route.params.uri; // Get the URI of the audio file
  //     // Check if the URI is already saved to AsyncStorage
  //     const savedUri = await AsyncStorage.getItem('audioUri');
  //     if (!savedUri) {
  //       // Save the URI to AsyncStorage
  //       await AsyncStorage.setItem('audioUri', uri);
  //       console.log('Audio URI saved to AsyncStorage:', uri);
  //     }
  //   } catch (error) {
  //     console.error('Error saving audio URI to AsyncStorage:', error);
  //   }
  // };
  
// Load audio URI from AsyncStorage when the component mounts
// useEffect(() => {
//   const loadFromAsyncStorage = async () => {
//     try {
//       const savedUri = await AsyncStorage.getItem('audioUri');
//       if (savedUri) {
//         // Load the audio file asynchronously
//         const { sound } = await Audio.Sound.createAsync({ uri: savedUri });
//         setSound(sound);
//       } else {
//         console.log('No audio URI found in AsyncStorage.');
//       }
//     } catch (error) {
//       console.error('Error loading audio URI from AsyncStorage:', error);
//     }
//   };

//   loadFromAsyncStorage();

//   // Cleanup function
//   return () => {
//     if (sound) {
//       console.log('Unloading Sound');
//       sound.unloadAsync();
//     }
//   };
// }, []);



  return (
    <View className="flex-1" style={{ backgroundColor: '#191A23' }}>
        <SafeAreaView className="flex-1 flex mx-5">
            <View className="space-y-2 flex-1">  

            {/* TOP MENU BUTTON OPTIONS */}
            <View className="p-9 space-y-2" >
                {/* X */}
                {/* ••• */}
            </View>

            {/* PLAYBACK SECTION */}
            <Text style={{ fontSize: wp(3.5) }} className="font-regular text-gray-400">
            Well Spoken!
            </Text>
            <View className="p-4 rounded-xl space-y-2" style={{ backgroundColor: '#242830' }}>
              
                <View className="flex-row items-center space-x-1">
                    <Image
                    source={require("../../assets/images/noteicon.png")}
                    style={{ height: hp(3), width: hp(3) }}
                    className="mr-2"
                    />                    
              {/* Add a TextInput for the user to input the note title */}
              <TextInput
                style={{
                  height: 40,
                  borderColor: 'gray',
                  borderWidth: 1,
                  fontSize: 18,
                  color: 'white',
                  padding: 8,
                  borderRadius: 5,
                  borderColor: 'transparent'
                }}
                value={noteTitle}
                onChangeText={(text) => setNoteTitle(text)}
              />

                </View>
                <View>
                    <Text style={{ fontSize: wp(3.7)}} className="text-gray-400 font-regular mt-2">
                    {month} {date}, {year} - Lapa, Lisboa
                    </Text>
                </View>
                <Playback uri={uri} />
            </View>

            {/* TRANSCRIPT SECTION */}
            {/* <Text style={{ fontSize: wp(5) }} className="text-white font-semibold ml-1 mb-1">
              Live Transcript
            </Text>
            <View style={{ height: hp(45), backgroundColor: '#242830' }} className="bg-neutral-200 rounded-3xl p-4">
              <ScrollView
                ref={ScrollViewRef}
                bounces={false}
                className="space-y-4"
                showsVerticalScrollIndicator={false}
              >
                <View className="flex-row justify-left">
                  <View style={{ width: wp(80) }} className="rounded-xl p-4 rounded-tr-none">
                    <Text className="text-white font-bold" style={{ fontSize: wp(3.8) }}>
                      {route.params.transcription}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            </View> */}
            </View>
        </SafeAreaView>
    </View>
)}
