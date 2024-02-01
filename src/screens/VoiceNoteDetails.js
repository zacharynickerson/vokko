import { Button, Image, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import React, { startTransition, useEffect, useRef, useState } from 'react';
import { db, storage } from '/Users/zacharynickerson/VokkoApp/config/firebase.js';
import {heightPercentageToDP as hp, widthPercentageToDP as wp} from 'react-native-responsive-screen';
import { ref, set, update } from 'firebase/database';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import Playback from "../components/playback.js"
import auth from "@react-native-firebase/app";
import uploadAudioFile from '/Users/zacharynickerson/VokkoApp/config/firebase.js';
import { useNavigation } from '@react-navigation/native';

export default function VoiceNoteDetails({ route }) {
  // const navigation = useNavigation();
    // const formattedDate = d[1]
  const { uri, messages, date, month, year } = route.params;
  const sound = new Audio.Sound();
  const ScrollViewRef = useRef();
  const [parsedExistingNotes] = useState([]);
  const d = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const [noteTitle, setNoteTitle] = useState('');
  
  // Use the noteTitle from route.params when the component mounts
  useEffect(() => {
    setNoteTitle(route.params.noteTitle || `Recording ${parsedExistingNotes.length + 1}`);
  }, [route.params.noteTitle, parsedExistingNotes]);

  // Debounce the saveAsyncData function to avoid saving for every character typed
  const debounceSave = useRef(null);

  // Clear the timeout if the component unmounts or noteTitle changes before the timeout completes
  useEffect(() => {
    clearTimeout(debounceSave.current);
    debounceSave.current = setTimeout(() => {
      saveAsyncData({
        date: route.params.date,
        month: route.params.month,
        year: route.params.year,
        uri: route.params.uri,
        messages: messages,
        noteTitle: noteTitle || `Recording ${parsedExistingNotes.length + 1}`,
      });
    }, 500); // Adjust the delay as needed (e.g., 500 milliseconds)
  }, [noteTitle, parsedExistingNotes]); // Include noteTitle as a dependency
  
    
  // Load the saved metadata and transcript from AsyncStorage
  useEffect(() => {
    const loadAsyncData = async () => {
      try {
        const savedData = await AsyncStorage.getItem('voiceNoteData');
        if (savedData) {
          const { metadata, transcript, audioUri } = JSON.parse(savedData);
          console.log('Loaded metadata:', metadata);
          console.log('Loaded transcript:', transcript);
          console.log('Loaded audio URI:', audioUri);
  
          // Handle undefined or invalid dates
          // const loadedDate = metadata.date || new Date().toISOString(); // Use a default date if undefined
  
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
        }
      } catch (error) {
        console.error('Error loading data from AsyncStorage:', error);
      }
    };
  
    // Call the function when the component mounts
    loadAsyncData();
  }, []);

  const saveAsyncData = async (voiceNote) => {
    try {
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
        parsedExistingNotes[existingNoteIndex] = voiceNote;
      } else {
        // Add the new voice note to the end of the array with a unique default title
        voiceNote.noteTitle = voiceNote.noteTitle || `Recording ${parsedExistingNotes.length + 1}`;
        parsedExistingNotes.push(voiceNote);
      }
  
      // Save the updated list back to AsyncStorage
      await AsyncStorage.setItem('voiceNotesList', JSON.stringify(parsedExistingNotes));
      
      console.log('Data saved to AsyncStorage:', parsedExistingNotes);
    } catch (error) {
      console.error('Error saving data to AsyncStorage:', error);
    }
  };

      useEffect(() => {
        // Call saveAsyncData with the data for the new voice note
        saveAsyncData({
          uri: route.params.uri,
          date: route.params.date,
          month: route.params.month,
          d: route.params.d,
          noteTitle: noteTitle,
          year: route.params.year,
        });  console.log('VoiceNoteDetails component rerendered with new noteTitle:', noteTitle);

      }, [noteTitle]);;
  
      console.log('CURRENT NOTE TITLE', noteTitle);



      ////////////////////////////////////////
      //THESE ARE THE FIRE BASE TINGS
      ////////////////////////////////////////
      


      //Upload audio file to Firebase Storage
      const [fileURI, setFileURI] = useState(null);
      const pickDocument = async () => {
      try {
        // Use the URI of the currently loaded voice note instead of picking a new document
        const uri = route.params.uri;

        if (uri) {
          setFileURI(uri);

          // Call the function to upload the audio file
          const downloadURL = await uploadAudioFile(uri);
          console.log('Download URL from Firebase:', downloadURL);
        } else {
          console.log('No URI found for the currently loaded voice note.');
        }
      } catch (err) {
        console.log(err);
      }
    };

    //Upload audio file to Firebase Storage
    // const saveToFirebase = async (uri, noteTitle) => {
    //   await db().ref(`/users/${currentUser}/sessions/${sessionId}`.set({
    //     uri: route.params.uri,
    //     date: route.params.date,
    //     month: route.params.month,
    //     d: route.params.d,
    //     noteTitle: noteTitle,
    //     year: route.params.year,
    //   }))
    // }
    
      // //Add note data to firebase
      // const addToFirebase = () => {
      //   const currentNoteTitle = noteTitle || `Recording ${parsedExistingNotes.length + 1}`;
      //   update(ref(db, `posts/${currentNoteTitle}`), {
      //     date: route.params.date,
      //     month: route.params.month,
      //     year: route.params.year,
      //     uri: route.params.uri,
      //     messages: route.params.messages,
      //     noteTitle: currentNoteTitle,
      //   });
      //   setNoteTitle(currentNoteTitle); // Update the state with the currentNoteTitle
      // };

        
      //Upload audio file to Firebase Storage
      const submitForCompletion = async () => {{
        const currentUser = auth().currentUser
        console.log('Start firebase submission');
        if (currentUser) {
          await addToFirebase(currentUser.uid, uri, noteTitle)
          console.log('console.log("Successfully uploaded to firebase")');
        }
      };      
    }


  return (
    <View className="flex-1" style={{ backgroundColor: '#191A23' }}>
        <SafeAreaView className="flex-1 flex mx-5">
            <View className="space-y-2 flex-1">  

            {/* TOP MENU BUTTON OPTIONS */}
            <View className="p-9 space-y-2" >
                {/* X */}
                {/* ••• */}
                <Button title="Upload Storage" onPress={() => { pickDocument(); }} />
                <Button title="Upload Database" onPress={() => { submitForCompletion(); }} />

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
              Transcript
            </Text>

            {Array.isArray(messages) && messages.length > 0 ? (
              <View style={{ height: hp(45), backgroundColor: '#242830' }} className="bg-neutral-200 rounded-3xl p-4">
                <ScrollView
                  ref={ScrollViewRef}
                  bounces={false}
                  className="space-y-4"
                  showsVerticalScrollIndicator={false}
                >
                  {messages.map((message, index) => (
                    <View key={index} className="flex-row justify-left">
                      <View style={{ width: wp(80) }} className="rounded-xl p-4 rounded-tr-none">
                        <Text className="text-white font-bold" style={{ fontSize: wp(3.8) }}>
                          {message.content}
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : (
              <Text style={{ color: 'white' }}>{messages}</Text>
            )}

               
               
            </View>
        </SafeAreaView>
    </View>
)}
