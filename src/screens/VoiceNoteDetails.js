// Import necessary modules and components from React Native and other libraries
import { Image, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { db, storage } from '/Users/zacharynickerson/VokkoApp/config/firebase.js'; // Import Firebase configuration
import { get, onValue, ref, set } from 'firebase/database'; // Import Firebase Realtime Database functions
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen'; // Import functions for responsive screen design

import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage for storing data locally
import { Audio } from 'expo-av'; // Import Audio module from Expo for handling audio playback
import Playback from "../components/playback.js"; // Import custom Playback component
import uploadAudioFile from '/Users/zacharynickerson/VokkoApp/config/firebase.js'; // Import function for uploading audio files to Firebase Storage

// import { useNavigation } from '@react-navigation/native';

// Define the functional component VoiceNoteDetails
export default function VoiceNoteDetails({ route }) {

  // Destructure route.params to get voice note attributes
  const { uri, messages, date, month, year } = route.params;
  // Define state variables for note title, transcription, and other attributes
  const [noteTitle, setNoteTitle] = useState('');
  const [transcription, setTranscription] = useState('');
  const ScrollViewRef = useRef(); // Reference for ScrollView component
  const [parsedExistingNotes] = useState([]); // State variable for existing notes (unused)
  const sound = new Audio.Sound(); // Initialize Audio.Sound object for audio playback
  const [alreadySavedToFBS, setAlreadySavedToFBS] = useState(false); // State variable to track if audio is already saved to Firebase Storage

  // Function to save the voice note recording to Firebase Storage
  const saveToFirebaseStorage = async () => {
    if (!alreadySavedToFBS) {
      const uri = route.params.uri; // Get the URI of the audio file
      uploadAudioFile(uri); // Upload the audio file to Firebase Storage
      console.log("Successfully uploaded to Firebase Storage");
      setAlreadySavedToFBS(true); // Update state to indicate audio saved to Firebase Storage
    }
  };

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
    console.log('Data saved to Firebase Realtime Database:', voiceNote);
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
      saveToFirebaseStorage(); // Save to Firebase Storage only once
    }, 500); // Adjust the delay as needed (e.g., 500 milliseconds)
  }, [noteTitle, parsedExistingNotes]);
  
  // When the component mounts, set the noteTitle from route.params
  useEffect(() => {
    setNoteTitle(route.params.noteTitle || `Recording ${parsedExistingNotes.length + 1}`);
  }, [route.params.noteTitle, parsedExistingNotes]);

  // Set up listener for transcription changes in Firebase Realtime Database
  useEffect(() => {
    const databaseURI = route.params.uri.split('/').pop();
    const uriKey = databaseURI.replace(/[.#$/[\]]/g, '');
    const transcriptionRef = ref(db, `voiceNotes/${uriKey}/transcription`);

    // Check if the voice note exists before setting up the listener
    const checkVoiceNoteExists = async () => {
      try {
        const snapshot = await get(ref(db, `voiceNotes/${uriKey}`));
        if (snapshot.exists()) {
          const unsubscribe = onValue(transcriptionRef, (snapshot) => {
            const updatedTranscription = snapshot.val();
            setTranscription(updatedTranscription || '');
          });
          return () => unsubscribe();
        } else {
          console.log('Voice note does not exist in the database.');
        }
      } catch (error) {
        console.error('Error checking voice note existence:', error);
      }
    };

    const unsubscribe = checkVoiceNoteExists();
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [route.params.uri]);


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
                    source={require("/Users/zacharynickerson/VokkoApp/assets/images/noteicon.png")}
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
            <Text style={{ fontSize: wp(5) }} className="text-white font-semibold ml-1 mb-1">
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
            </View>
            </View>
        </SafeAreaView>
    </View>
)}





  // // Load saved data from AsyncStorage when the component mounts
  // useEffect(() => {
  //   const loadAsyncData = async () => {
  //     try {
  //       const savedData = await AsyncStorage.getItem('voiceNoteData');
  //       if (savedData) {
  //         const { audioUri } = JSON.parse(savedData);
  //         // console.log('Loaded metadata:', metadata);
  //         console.log('Loaded audio URI:', audioUri);
  //         if (audioUri) {
  //           // Load and play the audio file asynchronously
  //           await sound.loadAsync({ uri: audioUri });
  //           await sound.playAsync();
  //         } else {
  //           console.error('Audio URI is undefined or invalid.');
  //         }
  //       }
  //     } catch (error) {
  //       console.error('Error loading data from AsyncStorage:', error);
  //     }
  //   };

  //   // Call the function when the component mounts
  //   loadAsyncData();
  // }, []);


  // Function to save the voice note to AsyncStorage
// const saveAsyncData = async (voiceNote) => {
//   try {
//     // Retrieve existing voice notes from AsyncStorage
//     let existingVoiceNotes = await AsyncStorage.getItem('voiceNotesList');

//     // If 'voiceNotesList' is not defined, initialize it to an empty array
//     if (!existingVoiceNotes) {
//       existingVoiceNotes = '[]';
//     }

//     const parsedExistingNotes = JSON.parse(existingVoiceNotes); // Parse existing voice notes

//     // Check if a voice note with the same URI already exists
//     const existingNoteIndex = parsedExistingNotes.findIndex((note) => note.uri === voiceNote.uri);

//     if (existingNoteIndex !== -1) {
//       // Update the existing voice note
//       parsedExistingNotes[existingNoteIndex].noteTitle = voiceNote.noteTitle || `Recording ${parsedExistingNotes.length + 1}`;
//       // Preserve the existing transcription value if it doesn't exist
//       if (!parsedExistingNotes[existingNoteIndex].transcription) {
//         parsedExistingNotes[existingNoteIndex].transcription = voiceNote.transcription;
//       }
//     } else {
//       // Add the new voice note to the end of the array with a unique default title
//       voiceNote.noteTitle = voiceNote.noteTitle || `Recording ${parsedExistingNotes.length + 1}`;
//       parsedExistingNotes.push(voiceNote);
//     }

//     // Save the updated list back to AsyncStorage
//     await AsyncStorage.setItem('voiceNotesList', JSON.stringify(parsedExistingNotes));

//     console.log('Data saved to AsyncStorage:', parsedExistingNotes);
//   } catch (error) {
//     console.error('Error saving data to AsyncStorage:', error);
//   }
// };

  