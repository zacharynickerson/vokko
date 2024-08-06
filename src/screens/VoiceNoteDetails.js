import { Modal, TouchableOpacity, TouchableWithoutFeedback, Dimensions, ActivityIndicator, Image, Alert, StyleSheet, SafeAreaView, Text, TextInput, View, ScrollView, FlatList } from 'react-native';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { Audio } from 'expo-av';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import Playback from "../components/playback.js";
import EmojiSelector from 'react-native-emoji-selector';
import { getVoiceNotesFromLocal, saveVoiceNotesToLocal } from '../utilities/voiceNoteLocalStorage';
import { db, storage, auth } from '../../config/firebase';
import { get, onValue, ref, set } from 'firebase/database';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import { useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');



export default function VoiceNoteDetails({ route, navigation }) {
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
  const playbackRef = useRef(null);



  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'summary', title: 'Summary' },
    { key: 'tasks', title: 'Tasks' },
    { key: 'transcript', title: 'Script' }
  ]);



  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (playbackRef.current) {
        playbackRef.current.stopAudio();
      }
    });

    return unsubscribe;
  }, [navigation]);


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

  const handleBack = () => {
    navigation.goBack();
  };

  const handleShare = () => {
    // Implement share functionality
    console.log('Share note');
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Note",
      "Are you sure you want to delete this note?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete", 
          onPress: () => {
            // Implement delete functionality
            console.log('Delete note');
            navigation.goBack();
          },
          style: "destructive"
        }
      ]
    );
  };

  const renderScene = SceneMap({
    summary: () => (
      <ScrollView style={styles.tabContent}>
        {summaryLoading ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : (
          summary.split('.').filter(sentence => sentence.trim().length > 0).map((sentence, index) => (
            <Text key={index} style={styles.contentText}>
              {sentence.trim() + '.'}
            </Text>
          ))
        )}
      </ScrollView>
    ),
    tasks: () => (
      <FlatList
        style={styles.tabContent}
        data={taskArray}
        renderItem={({ item }) => (
          <View style={styles.taskItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.contentText}>{item.replace(/^[-•]\s*/, '')}</Text>
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
      />
    ),
    transcript: () => (
      <ScrollView style={styles.tabContent}>
        {transcript.split('.').filter(sentence => sentence.trim().length > 0).map((sentence, index) => (
          <Text key={index} style={styles.contentText}>
            {sentence.trim() + '.'}
          </Text>
        ))}
      </ScrollView>
    ),
  });

  const renderTabBar = props => (
    <TabBar
      {...props}
      indicatorStyle={styles.tabIndicator}
      style={styles.tabBar}
      labelStyle={styles.tabLabel}
      renderLabel={({ route, focused }) => (
        <Text style={[styles.tabLabelText, focused && styles.tabLabelFocused]}>
          {route.title}
        </Text>
      )}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navigationBar}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Menu>
          <MenuTrigger>
            <Ionicons name="ellipsis-vertical" size={24} color="#fff" style={styles.menuTrigger} />
          </MenuTrigger>
          <MenuOptions customStyles={menuOptionsStyles}>
            <MenuOption onSelect={handleShare}>
              <View style={styles.menuItem}>
                <Ionicons name="share-outline" size={20} color="#fff" />
                <Text style={styles.menuText}>Share</Text>
              </View>
            </MenuOption>
            <MenuOption onSelect={handleDelete}>
              <View style={styles.menuItem}>
                <Ionicons name="trash-outline" size={20} color="#FF453A" />
                <Text style={[styles.menuText, styles.deleteText]}>Delete</Text>
              </View>
            </MenuOption>
          </MenuOptions>
        </Menu>
      </View>

      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.emojiContainer} 
          onPress={() => setIsEmojiPickerVisible(true)}
        >
          <Text style={styles.emoji}>{noteEmoji}</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <TextInput
            style={styles.titleInput}
            value={noteTitle}
            onChangeText={setNoteTitle}
            multiline
            placeholder="Enter note title"
            placeholderTextColor="#888"
          />
          <Text style={styles.dateLocation}>
            {voiceNote.createdDate} • {voiceNote.location}
          </Text>
        </View>
      </View>

      <View style={styles.playbackContainer}>
        <Playback uri={voiceNote.uri} ref={playbackRef}/>
      </View>

      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        renderTabBar={renderTabBar}
        onIndexChange={setIndex}
        initialLayout={{ width: wp(100) }}
        style={styles.tabView}
      />

      {/* Emoji Picker Modal */}
      <Modal
        visible={isEmojiPickerVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
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
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#191A23',
  },
  container: {
    flex: 1,
    backgroundColor: '#191A23',
  },
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#242830',
  },
  backButton: {
    padding: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  menuText: {
    fontSize: wp(4),
    color: '#fff',
    marginLeft: 10,
  },
  deleteText: {
    color: '#FF453A',
  },
  menuTrigger: {
    padding: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#242830',
  },
  emojiContainer: {
    marginRight: 12,
  },
  emoji: {
    fontSize: 32,
  },
  titleContainer: {
    flex: 1,
  },
  titleInput: {
    fontSize: wp(5),
    color: '#fff',
    fontWeight: '600',
    padding: 0,
  },
  dateLocation: {
    fontSize: wp(3.5),
    color: '#888',
    marginTop: 4,
  },
  playbackContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#242830',
  },
  tabView: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: '#191A23',
    borderBottomWidth: 1,
    borderBottomColor: '#242830',
  },
  tabIndicator: {
    backgroundColor: '#007AFF',
  },
  tabLabel: {
    fontWeight: '600',
  },
  tabLabelText: {
    color: '#888',
    fontSize: wp(4),
  },
  tabLabelFocused: {
    color: '#fff',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  contentText: {
    fontSize: wp(4),
    color: '#fff',
    marginBottom: 12,
    lineHeight: wp(5.5),
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bullet: {
    fontSize: wp(4),
    color: '#fff',
    marginRight: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#242830',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: height * 0.6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#191A23',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  emojiPicker: {
    flex: 1,
  },
});

const menuOptionsStyles = {
  optionsContainer: {
    backgroundColor: '#242830',
    borderRadius: 10,
    padding: 5,
    width: 150,
  },
  optionWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#191A23',
  },
  optionTouchable: {
    underlayColor: 'rgba(255, 255, 255, 0.1)',
    activeOpacity: 70,
  },
};

  
//   const renderScene = SceneMap({
//     summary: () => (
//       <ScrollView style={{ padding: 20 }}>
//         {summaryLoading ? (
//           <ActivityIndicator size="large" color="#ffffff" />
//         ) : (
//           summary.split('.').filter(sentence => sentence.trim().length > 0).map((sentence, index) => (
//             <View key={index} style={{ marginBottom: 20 }}>
//               <Text style={{ color: 'white', fontSize: wp(4) }}>
//                 {sentence.trim() + '.'}
//               </Text>
//             </View>
//           ))
//         )}
//       </ScrollView>
//     ),
//     tasks: () => (
//       <View style={{ flex: 1, padding: 20 }}>
//         {tasksLoading ? (
//           <ActivityIndicator size="large" color="#ffffff" />
//         ) : (
//           <FlatList
//             data={taskArray}
//             renderItem={({ item }) => (
//               <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
//                 <Text style={{ color: 'white', fontSize: wp(4), marginRight: 10 }}>•</Text>
//                 <Text style={{ color: 'white', fontSize: wp(4), flex: 1 }}>
//                   {item.replace(/^[-•]\s*/, '')}
//                 </Text>
//               </View>
//             )}
//             keyExtractor={(item, index) => index.toString()}
//           />
//         )}
//       </View>
//     ),
//     transcript: () => (
//       <ScrollView style={{ padding: 20 }}>
//         {transcript.split('.').filter(sentence => sentence.trim().length > 0).map((sentence, index) => (
//           <View key={index} style={{ marginBottom: 20 }}>
//             <Text style={{ color: 'white', fontSize: wp(4) }}>
//               {sentence.trim() + '.'}
//             </Text>
//           </View>
//         ))}
//       </ScrollView>
//     ),
//   });

//   const renderTabBar = props => (
//     <TabBar
//       {...props}
//       indicatorStyle={{ backgroundColor: 'white' }}
//       style={{ backgroundColor: '#191A23' }}
//       labelStyle={{ fontWeight: 'bold' }}
//       renderLabel={({ route, focused }) => (
//         <Text style={{ color: focused ? 'white' : 'gray' }}>
//           {route.title}
//         </Text>
//       )}
//     />
//   );

//   return (
//     <View className="flex-1" style={{ backgroundColor: '#191A23' }}>
//       <SafeAreaView className="flex-1 flex mx-5">
//         <View className="space-y-2 flex-1">

//      {/* PLAYBACK SECTION */}
//      <View style={styles.playbackSection}>
//         <TouchableOpacity 
//           style={styles.emojiContainer} 
//           onPress={() => setIsEmojiPickerVisible(true)}
//         >
//           <Text style={styles.emoji}>{noteEmoji}</Text>
//         </TouchableOpacity>
//         <View style={styles.contentContainer}>
//           <TextInput
//             style={styles.titleInput}
//             value={noteTitle}
//             onChangeText={(text) => setNoteTitle(text)}
//             multiline
//             placeholder="Enter note title"
//             placeholderTextColor="#888"
//           />
//           <Text style={styles.dateLocation}>
//             {voiceNote.createdDate} • {voiceNote.location}
//           </Text>
//           <Playback uri={voiceNote.uri} />
//         </View>
//       </View>

//       {/* Emoji Picker Modal */}
//       <Modal
//         visible={isEmojiPickerVisible}
//         transparent={true}
//         animationType="fade"
//       >
//         <SafeAreaView style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalHeaderTitle}>Choose Emoji</Text>
//               <TouchableOpacity onPress={() => setIsEmojiPickerVisible(false)}>
//                 <Text style={styles.closeButton}>Close</Text>
//               </TouchableOpacity>
//             </View>
//             <EmojiSelector
//               onEmojiSelected={handleEmojiSelected}
//               columns={8}
//               showSearchBar={true}
//               showSectionTitles={true}
//               showHistory={true}
//               style={styles.emojiPicker}
//               category={undefined}
//             />
//           </View>
//         </SafeAreaView>
//       </Modal> 
      

//           {/* OUTPUT */}

//           <View style={{ flex: 1, backgroundColor: '#191A23' }} className="bg-neutral-200 rounded-3xl p-4">
//             <TabView
//               navigationState={{ index, routes }}
//               renderScene={renderScene}
//               renderTabBar={renderTabBar}
//               onIndexChange={setIndex}
//               initialLayout={{ width: wp(100) }}
//               style={{ backgroundColor: '#191A23' }}
//             />
//           </View>
//         </View>
//       </SafeAreaView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   playbackSection: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     padding: 16,
//     borderRadius: 10,
//     marginBottom: 20,
//   },
//   iconContainer: {
//     marginRight: 12,
//     paddingTop: 2,
//   },
//   contentContainer: {
//     flex: 1,
//   },
//   emojiContainer: {
//     marginRight: 12,
//     paddingTop: 2,
//   },
//   emoji: {
//     fontSize: 24,
//   },
//   titleInput: {
//     fontSize: wp(4),
//     color: '#fff',
//     fontWeight: '500',
//     padding: 0,
//     marginBottom: 4,
//   },
//   dateLocation: {
//     fontSize: wp(3.5),
//     color: '#888',
//     marginBottom: 12,
//   },
//   modalContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//   },
//   modalContent: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 20,
//     width: width * 0.9, // 90% of screen width
//     height: height * 0.7, // 70% of screen height
//     overflow: 'hidden',
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#EEEEEE',
//   },
//   modalHeaderTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   closeButton: {
//     fontSize: 16,
//     color: '#007AFF',
//   },
//   emojiPicker: {
//     flex: 1,
//     padding: 10,
//   },
// });