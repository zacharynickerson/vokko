import { Modal, TouchableOpacity, TouchableWithoutFeedback, Dimensions, ActivityIndicator, Image, StyleSheet, SafeAreaView, Text, TextInput, View, ScrollView, FlatList } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { Audio } from 'expo-av';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import Playback from "../components/playback.js";
import EmojiSelector from 'react-native-emoji-selector';
import { getVoiceNotesFromLocal, saveVoiceNotesToLocal } from '../utilities/voiceNoteLocalStorage';
import { db, storage, auth } from '../../config/firebase';
import { get, onValue, ref, set } from 'firebase/database';
import { FontAwesome5 } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');



export default function VoiceNoteDetails({ route }) {
  const { voiceNote } = route.params;
  // Destructure route.params to get voice note attributes
  const { voiceNoteId, uri, createdDate, location } = voiceNote;

  // Initialize noteTitle with the titlqe from voiceNote
  const [noteTitle, setNoteTitle] = useState(voiceNote.title);
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [taskArray, setTaskArray] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [noteEmoji, setNoteEmoji] = useState(voiceNote.emoji || '🎙️'); // Default to microphone emoji if not set
  const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false);
  const emojiButtonRef = useRef();


  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'summary', title: 'Summary' },
    { key: 'tasks', title: 'Tasks' },
    { key: 'transcript', title: 'Script' }
  ]);


  // Load transcript from Firebase Realtime Database
  useEffect(() => {
    const voiceNoteRef = ref(db, `users/${auth.currentUser.uid}/voiceNotes/${voiceNoteId}`);
    
    const handleData = (snapshot) => {
      const voiceNoteData = snapshot.val();
      if (voiceNoteData) {
        setTranscript(voiceNoteData.transcript || '');
        if (voiceNoteData.title) {
          setNoteTitle(voiceNoteData.title);
        }
        if (voiceNoteData.summary) {
          setSummary(voiceNoteData.summary);
          setSummaryLoading(false);
        }
        if (voiceNoteData.taskArray) {
          setTaskArray(voiceNoteData.taskArray);
          setTasksLoading(false);
        }
      }
    };
  
    onValue(voiceNoteRef, handleData);
  
    return () => {
      onValue(voiceNoteRef, handleData);
    };
  }, [voiceNoteId]);
  


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


  const handleEmojiSelected = async (emoji) => {
    setNoteEmoji(emoji);
    setIsEmojiPickerVisible(false);

    try {
      const existingVoiceNotes = await getVoiceNotesFromLocal();
      const updatedVoiceNotes = existingVoiceNotes.map(note => {
        if (note.voiceNoteId === voiceNote.voiceNoteId) {
          return { ...note, emoji: emoji };
        }
        return note;
      });
      await saveVoiceNotesToLocal(updatedVoiceNotes);
    } catch (error) {
      console.error('Failed to update note emoji:', error);
    }
  };

  const renderScene = SceneMap({
    summary: () => (
      <ScrollView style={{ padding: 20 }}>
        {summaryLoading ? (
          <ActivityIndicator size="large" color="#ffffff" />
        ) : (
          summary.split('.').filter(sentence => sentence.trim().length > 0).map((sentence, index) => (
            <View key={index} style={{ marginBottom: 20 }}>
              <Text style={{ color: 'white', fontSize: wp(4) }}>
                {sentence.trim() + '.'}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    ),
    tasks: () => (
      <View style={{ flex: 1, padding: 20 }}>
        {tasksLoading ? (
          <ActivityIndicator size="large" color="#ffffff" />
        ) : (
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
          />
        )}
      </View>
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
     <View style={styles.playbackSection}>
        <TouchableOpacity 
          style={styles.emojiContainer} 
          onPress={() => setIsEmojiPickerVisible(true)}
        >
          <Text style={styles.emoji}>{noteEmoji}</Text>
        </TouchableOpacity>
        <View style={styles.contentContainer}>
          <TextInput
            style={styles.titleInput}
            value={noteTitle}
            onChangeText={(text) => setNoteTitle(text)}
            multiline
            placeholder="Enter note title"
            placeholderTextColor="#888"
          />
          <Text style={styles.dateLocation}>
            {voiceNote.createdDate} • {voiceNote.location}
          </Text>
          <Playback uri={voiceNote.uri} />
        </View>
      </View>

      {/* Emoji Picker Modal */}
      <Modal
        visible={isEmojiPickerVisible}
        transparent={true}
        animationType="fade"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Choose Emoji</Text>
              <TouchableOpacity onPress={() => setIsEmojiPickerVisible(false)}>
                <Text style={styles.closeButton}>Close</Text>
              </TouchableOpacity>
            </View>
            <EmojiSelector
              onEmojiSelected={handleEmojiSelected}
              columns={8}
              showSearchBar={true}
              showSectionTitles={true}
              showHistory={true}
              style={styles.emojiPicker}
              category={undefined}
            />
          </View>
        </SafeAreaView>
      </Modal> 
      

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

const styles = StyleSheet.create({
  playbackSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
  },
  iconContainer: {
    marginRight: 12,
    paddingTop: 2,
  },
  contentContainer: {
    flex: 1,
  },
  emojiContainer: {
    marginRight: 12,
    paddingTop: 2,
  },
  emoji: {
    fontSize: 24,
  },
  titleInput: {
    fontSize: wp(4),
    color: '#fff',
    fontWeight: '500',
    padding: 0,
    marginBottom: 4,
  },
  dateLocation: {
    fontSize: wp(3.5),
    color: '#888',
    marginBottom: 12,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: width * 0.9, // 90% of screen width
    height: height * 0.7, // 70% of screen height
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  emojiPicker: {
    flex: 1,
    padding: 10,
  },
});