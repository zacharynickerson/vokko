import { Alert, Button, Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { FlatList, TextInput } from 'react-native-gesture-handler';
import React, { startTransition, useEffect, useRef, useState } from 'react';
import {heightPercentageToDP as hp, widthPercentageToDP as wp} from 'react-native-responsive-screen';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { Entypo } from "@expo/vector-icons"
import Features from '/Users/zacharynickerson/VokkoApp/src/components/features.js';
import { MaterialIcons } from '@expo/vector-icons';
import Playback from "../components/playback.js"
import { StatusBar } from 'expo-status-bar';
import Voice from '@react-native-voice/voice';
import { apiCall } from '../api/openAI.js';
import { authenticateGoogleDrive } from '/Users/zacharynickerson/VokkoApp/src/utilities/googleDriveUtils.js'; // Update the path
import axios from 'axios';
import { getAccessToken } from '/Users/zacharynickerson/VokkoApp/src/utilities/oauthUtil.js'; // Replace with the correct path
import { useNavigation } from '@react-navigation/native';

export default function VoiceNoteDetails({ route }) {
  const { uri, messages, date, month, year } = route.params;
  const sound = new Audio.Sound();
  const navigation = useNavigation();
  const ScrollViewRef = useRef();
  const [parsedExistingNotes, setParsedExistingNotes] = useState([]);
  const d = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const formattedDate = d[1]
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
          const loadedDate = metadata.date || new Date().toISOString(); // Use a default date if undefined
  
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



      const uploadToGoogleDrive = async (accessToken, filePath, noteTitle) => {
        try {
          const response = await axios.post(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=media',
            // Include your file content and metadata in the request
            {
              name: noteTitle, // Use noteTitle directly
              mimeType: 'audio/mp4',
              // Add other file metadata as needed
            },
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'audio/mp4', // Adjust the content type based on your file type
              },
            }
          );
      
          console.log('File uploaded to Google Drive:', response.data);
        } catch (error) {
          console.error('Error uploading file to Google Drive:', error);
        }
      };

      

      const handleUploadToGoogleDrive = async () => {
        try {
          console.log('Start handleUploadToGoogleDrive');
      
          // Obtain an access token through your OAuth 2.0 authentication flow
          const accessToken = await getAccessToken();
          console.log('Access Token:', accessToken);
      
          // Replace 'YOUR_FILE_PATH' with the actual file path on your device
          const filePath = route.params.uri;
          console.log('File Path:', filePath);
      
          console.log('Before uploadToGoogleDrive');
          uploadToGoogleDrive(accessToken, filePath, noteTitle);
          console.log('After uploadToGoogleDrive');
        } catch (error) {
          console.error('Error in handleUploadToGoogleDrive:', error);
        }
      };
  return (
    <View className="flex-1" style={{ backgroundColor: '#191A23' }}>
        <SafeAreaView className="flex-1 flex mx-5">
            <View className="space-y-2 flex-1">  

            {/* TOP MENU BUTTON OPTIONS */}
            <View className="p-9 space-y-2" >
                {/* X */}
                {/* ••• */}
                    {/* <Button style={StyleSheet.button} onPress={() => Sharing.shareAsync(recordingLine.file)} title="Share"></Button> */}
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

            {/* Inside your return statement, between the playback and transcript sections */}
            <TouchableOpacity
              onPress={handleUploadToGoogleDrive}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#242830',
                padding: 10,
                borderRadius: 8,
                marginVertical: 10,
              }}
            >
              <MaterialIcons name="cloud-upload" size={24} color="white" />
              <Text style={{ color: 'white', marginLeft: 10 }}>Send to Google Drive</Text>
            </TouchableOpacity>

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
