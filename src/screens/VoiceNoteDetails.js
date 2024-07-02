import { Image, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { Audio } from 'expo-av';
import Playback from "../components/playback.js";
import { getVoiceNotesFromLocal, saveVoiceNotesToLocal } from '../utilities/voiceNoteLocalStorage';
import { db, storage, auth } from '/Users/zacharynickerson/Desktop/vokko/config/firebase.js'; // Import db from Firebase configuration
import { get, onValue, ref, set } from 'firebase/database';


export default function VoiceNoteDetails({ route }) {
  const { voiceNote } = route.params;

  // Log the voiceNote to debug
  // console.log('Voice Note Details:', voiceNote);

  // Destructure route.params to get voice note attributes
  const { voiceNoteId, uri, createdDate, location, summary, taskArray } = voiceNote;

  // Initialize noteTitle with the title from voiceNote
  const [noteTitle, setNoteTitle] = useState(voiceNote.title);
  const [transcript, setTranscript] = useState('');

  // Load transcript from Firebase Realtime Database
  useEffect(() => {
    const voiceNoteRef = ref(db, `users/${auth.currentUser.uid}/voiceNotes/${voiceNoteId}`);
    
    // Function to handle data changes
    const handleData = (snapshot) => {
      const voiceNoteData = snapshot.val();
      if (voiceNoteData) {
        setTranscript(voiceNoteData.transcript || ''); // Update transcript state with latest value
      }
    };

    // Attach listener
    onValue(voiceNoteRef, handleData);

    // Detach listener when component unmounts
    return () => {
      onValue(voiceNoteRef, handleData); // Detach listener
    };
  }, [voiceNoteId]); // Only re-run effect if voiceNoteId changes



  const [sound, setSound] = useState(null); // Use useState to manage Audio.Sound object
  const ScrollViewRef = useRef(); // Reference for ScrollView component



  // Callback function for playback status update
  const onPlaybackStatusUpdate = async (newStatus) => {
    // Handle playback status update here if needed
  };

  // Load the audio file asynchronously when the component mounts
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
      if (sound) {
        console.log('Unloading Sound');
        sound.unloadAsync();
      }
    };
  }, [uri]);

  // Debounce the saveAsyncData function to avoid saving for every character typed
  const debounceSave = useRef(null);

  // Save note title only if it changes
  useEffect(() => {
    const saveAsyncData = async () => {
      try {
        const existingVoiceNotes = await getVoiceNotesFromLocal();
        const updatedVoiceNotes = existingVoiceNotes.map(note => {
          if (note.voiceNoteId === voiceNoteId) {
            return { ...note, title: noteTitle };
          }
          return note;
        });
        await saveVoiceNotesToLocal(updatedVoiceNotes);

        // navigation.setParams({ voiceNote: { ...voiceNote, title: noteTitle } });
        console.log('Note title saved:', noteTitle);
      } catch (error) {
        console.error('Failed to update note title:', error);
      }
    };

    if (noteTitle !== voiceNote.title) {
      clearTimeout(debounceSave.current);
      debounceSave.current = setTimeout(saveAsyncData, 500); // Adjust the delay as needed (e.g., 500 milliseconds)
    }

    // Cleanup function to clear timeout if the component unmounts or noteTitle changes
    return () => clearTimeout(debounceSave.current);
  }, [noteTitle, voiceNote.title, voiceNoteId]);

  return (
    <View className="flex-1" style={{ backgroundColor: '#191A23' }}>
      <SafeAreaView className="flex-1 flex mx-5">
        <View className="space-y-2 flex-1">

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
              <Text style={{ fontSize: wp(3.7) }} className="text-gray-400 font-regular mt-2">
                {createdDate} - {location}
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
                    {transcript}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}



  // // Callback function for playback status update
  // const onPlaybackStatusUpdate = useCallback(async (newStatus) => {
  //   // Handle playback status update here if needed
  // }, []);
  


  
