import {Button, Image, SafeAreaView, ScrollView, Text, TextInput, View} from 'react-native'
import React, { useEffect, useRef, useState } from 'react';
import { db, storage } from '/Users/zacharynickerson/VokkoApp/config/firebase.js';
import { get, onValue, ref, set } from 'firebase/database';
import {heightPercentageToDP as hp, widthPercentageToDP as wp} from 'react-native-responsive-screen';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import Playback from "../components/playback.js"
import uploadAudioFile from '/Users/zacharynickerson/VokkoApp/config/firebase.js';

// import { useNavigation } from '@react-navigation/native';

export default function VoiceNoteDetails({ route }) {

  // const navigation = useNavigation();



  //Voice note attributes
  const { uri, messages, date, month, year } = route.params;
  const [noteTitle, setNoteTitle] = useState('');
  const [transcription, setTranscription] = useState('');
  const ScrollViewRef = useRef();
  const [parsedExistingNotes] = useState([]);
  const sound = new Audio.Sound();
  const [savedToFirebaseStorage, setSavedToFirebaseStorage] = useState(false); // <-- Track if saved to Firebase Storage

    // Save the Voice Note Recording to Firebase Storage only once
    const saveToFirebaseStorageOnce = async () => {
      if (!savedToFirebaseStorage) {
        const uri = route.params.uri;
        uploadAudioFile(uri);
        console.log("UPLOADED COMPLETE")
        setSavedToFirebaseStorage(true); // <-- Update state to indicate saved to Firebase Storage
      }
    }

  //Save the Voice Note Recording to the FB Storage
  // const saveToFirebaseStorage = async () => {
  //   const uri = route.params.uri;
  //   uploadAudioFile(uri);
  //   console.log("UPLOADED COMPLETEE")
  // }
  
  //Save the Voice Note Object to Firebase Real Time Database
  const saveToFirebaseDatabase = async (voiceNote) => {
  try {

    // CREATE THE DATABASE URI BY EXTRACTING THE FILENAME FROM URI 
    const databaseURI = voiceNote.uri.split('/').pop();

    console.log("VOICE URI BITCH", voiceNote.uri);
    //************************************************************************************* */
    //THIS BASTARD IS THE FUCKING DIFFERENCE BETWEEN A LOADED AUDIO FROM LOCAL OR A TRANSCRIPT
    // Set the filename as the URI in the voiceNote object
    // voiceNote.uri = databaseURI;

    // Use the URI as the key instead of generating a new one
    const uriKey = databaseURI.replace(/[.#$/[\]]/g, ''); // Clean up the URI to make it a valid key
    console.log("BABA YETU YE - URIKEY", uriKey)
    
    // Fetch the existing voice note data from Firebase to preserve the transcription value
    const existingNoteSnapshot = await ref(db, `voiceNotes/${uriKey}`);
    const existingNoteData = (await get(existingNoteSnapshot)).val();

    // Preserve the existing transcription value if available
    if (existingNoteData && existingNoteData.transcription) {
      voiceNote.transcription = existingNoteData.transcription;
    }
    // Save the updated voice note data to Firebase
    await set(ref(db, `voiceNotes/${uriKey}`), voiceNote);
    console.log('Data saved to Firebase Realtime Database:', voiceNote);
  } catch (error) {
    console.error('Error saving data to Firebase:', error);
  }
};

 //Save Voice Note to AsyncStorage
 const saveAsyncData = async (voiceNote) => {
  try {
    // Extract the filename from the URI
    // const databaseURI = voiceNote.uri.split('/').pop();

    // // Set the filename as the URI in the voiceNote object
    // voiceNote.uri = databaseURI;

    // Retrieve existing voice notes from AsyncStorage
    let existingVoiceNotes = await AsyncStorage.getItem('voiceNotesList');

    // If 'voiceNotesList' is not defined, initialize it to an empty array
    if (!existingVoiceNotes) {
      existingVoiceNotes = '[]';
    }

    const parsedExistingNotes = JSON.parse(existingVoiceNotes);

    // Check if a voice note with the same URI already exists
    const existingNoteIndex = parsedExistingNotes.findIndex((note) => note.uri === voiceNote.uri);

    if (existingNoteIndex !== -1) {
      // Update the existing voice note
      parsedExistingNotes[existingNoteIndex].noteTitle = voiceNote.noteTitle || `Recording ${parsedExistingNotes.length + 1}`;
      // Preserve the existing transcription value
      if (!parsedExistingNotes[existingNoteIndex].transcription) {
        parsedExistingNotes[existingNoteIndex].transcription = voiceNote.transcription;
      }
    } else {
      // Add the new voice note to the end of the array with a unique default title
      voiceNote.noteTitle = voiceNote.noteTitle || `Recording ${parsedExistingNotes.length + 1}`;
      parsedExistingNotes.push(voiceNote);
    }

    // Save the updated list back to AsyncStorage
    await AsyncStorage.setItem('voiceNotesList', JSON.stringify(parsedExistingNotes));

    console.log('Data saved to AsyncStorage:', parsedExistingNotes);
    saveToFirebaseDatabase(voiceNote);
    saveToFirebaseStorageOnce(); // Save to Firebase Storage only once
  } catch (error) {
    console.error('Error saving data to AsyncStorage:', error);
  }
};
  
  // Use the noteTitle from route.params when the component mounts
  useEffect(() => {
    setNoteTitle(route.params.noteTitle || `Recording ${parsedExistingNotes.length + 1}`);
  }, [route.params.noteTitle, parsedExistingNotes]);
  
    useEffect(() => {
    const loadAsyncData = async () => {
      try {
        const savedData = await AsyncStorage.getItem('voiceNoteData');
        if (savedData) {
          const { metadata, transcript, audioUri } = JSON.parse(savedData);
          console.log('Loaded metadata:', metadata);
          // console.log('Loaded transcript:', transcript);
          console.log('Loaded audio URI:', audioUri);

          if (audioUri) {
            // Load the sound asynchronously
            await sound.loadAsync({ uri: audioUri });
  
            // Wait for the sound to finish loading
            await sound.setOnPlaybackStatusUpdate(async (status) => {
              if (status.isLoaded && status.isPlaying) {
                // Sound has finished loading, and it's currently playing
                console.log('Sound has finished loading');
              }
            });
  
            // Now, you can use the audioUri and loadedDate to load and play the audio file
            await sound.playAsync();
          } else {
            console.error('Audio URI is undefined or invalid.');
          }
  
          // // Only set the transcription if it's not already set
          // if (!transcription) {
          //   setTranscription(transcript);
          // }
        }
      } catch (error) {
        console.error('Error loading data from AsyncStorage:', error);
      }
    };
  
    // Call the function when the component mounts
    loadAsyncData();
  }, []);

  
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
            unsubscribe(); // Ensure unsubscribe is a function before invoking it
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
                {/* <Button title="Upload Storage" onPress={() => { pickDocument(); }} /> */}
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
                  {/* <Button
                    title="Save to Firebase"
                    onPress={saveToFirebaseStorage}
                  /> */}
                    <Text className="text-white font-bold" style={{ fontSize: wp(3.8) }}>
                      {transcription}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            </View>


            </View>
        </SafeAreaView>
    </View>
)}







  // Function to update the note title
  // const updateNoteTitle = async (originalUniqueKey, newNoteTitle) => {
  //   try {
  //     // Retrieve the existing data using the original unique key
  //     const snapshot = await get(ref(db, `voiceNotes/${originalUniqueKey}`));
  //     const existingData = snapshot.val();
  
  //     // Update the note title
  //     existingData.noteTitle = newNoteTitle;
  
  //     // Save the updated data back to Firebase using the original unique key
  //     await set(ref(db, `voiceNotes/${originalUniqueKey}`), existingData);
  //     console.log('Note title updated to:', newNoteTitle);
  //   } catch (error) {
  //     console.error('Error updating note title:', error);
  //   }
  // };

  // useEffect(() => {
  //   const fetchVoiceNoteData = async () => {
  //     try {
  //       //define variables
  //       const databaseURI = uri.split('/').pop();
  //       const uriKey = databaseURI.replace(/[.#$/[\]]/g, '');
  //       const existingNoteSnapshot = await ref(db, `voiceNotes/${uriKey}`);
  //       console.log("URI KEEEEEEEEY:", uriKey)
  //       const existingNoteData = (await get(existingNoteSnapshot)).val();
        
  //       //if voice note exists within fb rtb, set the transcription state to the existing value
  //       if (existingNoteData && existingNoteData.transcription) {
  //         setTranscription(existingNoteData.transcription); // Update transcription state
  //       }
  //     } catch (error) {
  //       console.error('Error fetching voice note data:', error);
  //     }
  //   };
  
  //   fetchVoiceNoteData();
  //   console.log("BIN LADEN DID A TERORIST ATTACK")
  // }
  // // , [uri]
  // ); // Fetch data when uri changes


    // const saveToFirebaseStorage = async () => {
  //   try {
  //     const uri = route.params.uri;
  //     console.log("URI EQUALS THS:", uri)
  //     if (uri && !uploadDone) {
  //       setUploadDone(true);
  //       const downloadURL = await uploadAudioFile(uri);
  //       setDownloadURL(downloadURL);
  //       console.log('Download URL from Firebase:', downloadURL);
  //       return downloadURL;
  //     } else {
  //       console.log('No URI found for the currently loaded voice note or upload already done.');
  //     }
  //   } catch (err) {
  //     console.log(err);
  //   }
  // };


    // Debounce the saveAsyncData function to avoid saving for every character typed
  // const debounceSave = useRef(null);

  // Clear the timeout if the component unmounts or noteTitle changes before the timeout completes
  // useEffect(() => {
  //   clearTimeout(debounceSave.current);
  //   debounceSave.current = setTimeout(() => {
  //     saveToFirebaseDatabase({
  //       date: route.params.date,
  //       month: route.params.month,
  //       year: route.params.year,
  //       uri: route.params.uri,
  //       messages: messages,
  //       transcription: transcription,
  //       noteTitle: noteTitle || `Recording ${parsedExistingNotes.length + 1}`,
  //     });
  //   }, 500); // Adjust the delay as needed (e.g., 500 milliseconds)
  // }, [noteTitle, parsedExistingNotes]); // Include noteTitle as a dependency


        // useEffect(() => {
      //   // Call saveAsyncData with the data for the new voice note
      //   saveAsyncData({
      //     uri: route.params.uri,
      //     date: route.params.date,
      //     month: route.params.month,
      //     // d: route.params.d,
      //     noteTitle: noteTitle,
      //     year: route.params.year,
      //     transcription: transcription,
      //   });  console.log('VoiceNoteDetails component rerendered with new noteTitle:', noteTitle);

      // }, [noteTitle]);;