import { Image, SafeAreaView, Text, TextInput, View, ScrollView, FlatList } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { Audio } from 'expo-av';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import Playback from "../components/playback.js";
import { getVoiceNotesFromLocal, saveVoiceNotesToLocal } from '../utilities/voiceNoteLocalStorage';
import { db, storage, auth } from '../../config/firebase';
import { get, onValue, ref, set } from 'firebase/database';


export default function VoiceNoteDetails({ route }) {
  const { voiceNote } = route.params;
  // Destructure route.params to get voice note attributes
  const { voiceNoteId, uri, createdDate, location } = voiceNote;

  // Initialize noteTitle with the titlqe from voiceNote
  const [noteTitle, setNoteTitle] = useState(voiceNote.title);
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [taskArray, setTaskArray] = useState('');

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'summary', title: 'Summary' },
    { key: 'tasks', title: 'Tasks' },
    { key: 'transcript', title: 'Script' }
  ]);


  // Load transcript from Firebase Realtime Database
  useEffect(() => {
    const voiceNoteRef = ref(db, `users/${auth.currentUser.uid}/voiceNotes/${voiceNoteId}`);
    
    // Function to handle data changes
    const handleData = (snapshot) => {
      const voiceNoteData = snapshot.val();
      if (voiceNoteData) {
        setTranscript(voiceNoteData.transcript || ''); // Update transcript state with latest value
        setSummary(voiceNoteData.summary || ''); // Update summary state with latest value
        setTaskArray(voiceNoteData.taskArray || []); // Update taskArray state with latest value
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
  // const ScrollViewRef = useRef(); // Reference for ScrollView component

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


  const renderScene = SceneMap({
    summary: () => (
      <ScrollView style={{ padding: 20 }}>
        {summary.split('.').filter(sentence => sentence.trim().length > 0).map((sentence, index) => (
          <View key={index} style={{ marginBottom: 20 }}>
            <Text style={{ color: 'white', fontSize: wp(4) }}>
              {sentence.trim() + '.'}
            </Text>
          </View>
        ))}
      </ScrollView>
    ),
    tasks: () => (
      <FlatList
        data={taskArray}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
            <Text style={{ color: 'white', fontSize: wp(4), marginRight: 10 }}>•</Text>
            <Text style={{ color: 'white', fontSize: wp(4), flex: 1 }}>
              {item.replace(/^[-•]\s*/, '')}
            </Text>
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
        style={{ padding: 20 }}
      />
    ),
    transcript: () => (
      <ScrollView style={{ padding: 20 }}>
        {transcript.split('.').filter(sentence => sentence.trim().length > 0).map((sentence, index) => (
          <View key={index} style={{ marginBottom: 20 }}>
            <Text style={{ color: 'white', fontSize: wp(4) }}>
              {sentence.trim() + '.'}
            </Text>
          </View>
        ))}
      </ScrollView>
    ),
  });

  const renderTabBar = props => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: 'white' }}
      style={{ backgroundColor: '#191A23' }}
      labelStyle={{ fontWeight: 'bold' }}
      renderLabel={({ route, focused }) => (
        <Text style={{ color: focused ? 'white' : 'gray' }}>
          {route.title}
        </Text>
      )}
    />
  );

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

          {/* OUTPUT */}

          <View style={{ flex: 1, backgroundColor: '#191A23' }} className="bg-neutral-200 rounded-3xl p-4">
            <TabView
              navigationState={{ index, routes }}
              renderScene={renderScene}
              renderTabBar={renderTabBar}
              onIndexChange={setIndex}
              initialLayout={{ width: wp(100) }}
              style={{ backgroundColor: '#191A23' }}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}