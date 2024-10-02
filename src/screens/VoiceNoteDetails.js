import { Modal, TouchableOpacity, Dimensions, Alert, StyleSheet, SafeAreaView, Text, TextInput, View, ScrollView, FlatList } from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { Audio } from 'expo-av';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import Playback from "../components/playback.js";
import EmojiSelector from 'react-native-emoji-selector';
import { getCurrentDate, formatDateForDisplay } from '../utilities/helpers';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
// import { getVoiceNotesFromLocal, saveVoiceNotesToLocal } from '../utilities/voiceNoteLocalStorage'; // Commented out
import { db, storage, auth } from '../../config/firebase';
import { get, onValue, ref, set } from 'firebase/database';
import { ref as storageRef, deleteObject, getMetadata, getDownloadURL } from 'firebase/storage';
import { ref as dbRef, remove } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
// const SkeletonLine = ({ width, style }) => {
//   const opacity = useSharedValue(0.3);

//   React.useEffect(() => {
//     opacity.value = withRepeat(
//       withTiming(0.6, { duration: 1000 }),
//       -1,
//       true
//     );
//   }, []);

//   const animatedStyle = useAnimatedStyle(() => ({
//     opacity: opacity.value,
//   }));

//   return (
//     <Animated.View
//       style={[
//         styles.skeletonLine,
//         { width },
//         style,
//         animatedStyle,
//       ]}
//     />
//   );
// };

// 

// const SkeletonParagraph = ({ lines, lastLineWidth = '100%' }) => (
//   <View style={styles.skeletonParagraph}>
//     {[...Array(lines)].map((_, i) => (
//       <SkeletonLine
//         key={i}
//         width={i === lines - 1 ? lastLineWidth : '100%'}
//         style={i !== lines - 1 ? styles.skeletonLineSpacing : null}
//       />
//     ))}
//   </View>
// );

export default function VoiceNoteDetails({ route, navigation }) {
  const { voiceNote } = route.params;
  const { voiceNoteId } = voiceNote;

  const [noteTitle, setNoteTitle] = useState('');
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [taskArray, setTaskArray] = useState([]);
  const [audioUri, setAudioUri] = useState(null);
  const [sound, setSound] = useState(null);
  const playbackRef = useRef(null);

  const loadAudioUri = useCallback(async () => {
    try {
      const audioRef = storageRef(storage, `users/${auth.currentUser.uid}/voiceNotes/${voiceNoteId}.m4a`);
      const url = await getDownloadURL(audioRef);
      setAudioUri(url);
    } catch (error) {
      console.error('Error fetching audio URL:', error);
    }
  }, [voiceNoteId]);

  useEffect(() => {
    loadAudioUri();
  }, [loadAudioUri]);

  useEffect(() => {
    let isMounted = true;
    const loadSound = async () => {
      if (audioUri) {
        try {
          console.log('Loading Sound');
          const { sound } = await Audio.Sound.createAsync(
            { uri: audioUri },
            { progressUpdateIntervalMillis: 1000 / 60 },
            onPlaybackStatusUpdate
          );
          if (isMounted) {
            setSound(sound);
          }
          console.log("loaded uri", audioUri);
        } catch (error) {
          console.error('Error loading sound:', error);
        }
      }
    };

    loadSound();

    return () => {
      isMounted = false;
      if (sound) {
        console.log('Unloading Sound');
        sound.unloadAsync();
      }
    };
  }, [audioUri]);

  const [titleLoading, setTitleLoading] = useState(true);
  const [transcriptLoading, setTranscriptLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [noteEmoji, setNoteEmoji] = useState(voiceNote.emoji || '🎙️'); // Default to microphone emoji if not set
  const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false);
  const emojiButtonRef = useRef();

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'transcript', title: 'Script' },
    { key: 'tasks', title: 'Tasks' },
    { key: 'summary', title: 'Summary' },
  ]);

  useEffect(() => {
    const noteRef = dbRef(db, `voiceNotes/${auth.currentUser.uid}/${voiceNoteId}`);
    
    const unsubscribe = onValue(noteRef, (snapshot) => {
      if (snapshot.exists()) {
        const noteData = snapshot.val();
        setNoteTitle(noteData.title || '');
        setTranscript(noteData.transcript || '');
        setSummary(noteData.summary || '');
        setTaskArray(noteData.actionItems || []);
      }
      setTitleLoading(false);
      setTranscriptLoading(false);
      setTasksLoading(false);
      setSummaryLoading(false);
    }, (error) => {
      console.error('Error fetching note details:', error);
    });

    return () => unsubscribe();
  }, [voiceNoteId]);

  const onPlaybackStatusUpdate = useCallback(async (status) => {
    // Handle playback status update here if needed
  }, []);

  const debounceSave = useRef(null);

  useEffect(() => {
    const saveAsyncData = async () => {
      try {
        // const existingVoiceNotes = await getVoiceNotesFromLocal(); // Commented out
        // const updatedVoiceNotes = existingVoiceNotes.map(note => {
        //   if (note.voiceNoteId === voiceNoteId) {
        //     return { ...note, title: noteTitle };
        //   }
        //   return note;
        // });
        // await saveVoiceNotesToLocal(updatedVoiceNotes); // Commented out

        // navigation.setParams({ voiceNote: { ...voiceNote, title: noteTitle } });
        console.log('Note title saved:', noteTitle);
      } catch (error) {
        console.error('Failed to update note title:', error);
      }
    };

    if (noteTitle !== voiceNote.title) {
      clearTimeout(debounceSave.current);
      debounceSave.current = setTimeout(saveAsyncData, 500);
    }

    return () => clearTimeout(debounceSave.current);
  }, [noteTitle, voiceNote.title, voiceNoteId]);

  const handleEmojiSelected = async (emoji) => {
    setNoteEmoji(emoji);
    setIsEmojiPickerVisible(false);

    try {
      // const existingVoiceNotes = await getVoiceNotesFromLocal(); // Commented out
      // const updatedVoiceNotes = existingVoiceNotes.map(note => {
      //   if (note.voiceNoteId === voiceNote.voiceNoteId) {
      //     return { ...note, emoji: emoji };
      //   }
      //   return note;
      // });
      // await saveVoiceNotesToLocal(updatedVoiceNotes); // Commented out
    } catch (error) {
      console.error('Failed to update note emoji:', error);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleShare = () => {
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
          onPress: async () => {
            try {
              console.log('Starting deletion process for voiceNoteId:', voiceNote.title);
  
              // 1. Delete from local storage
              // console.log('Fetching existing voice notes from local storage'); // Commented out
              // const existingVoiceNotes = await getVoiceNotesFromLocal(); // Commented out
  
              // const updatedVoiceNotes = existingVoiceNotes.filter(
              //   note => note.voiceNoteId !== voiceNoteId
              // );
  
              // await saveVoiceNotesToLocal(updatedVoiceNotes); // Commented out
              // console.log('Updated voice notes saved to local storage'); // Commented out
  
              // 2. Delete from Firebase Storage
              const audioRef = storageRef(storage, `users/${auth.currentUser.uid}/voiceNotes/${voiceNoteId}`);
              try {
                console.log('Attempting to delete from Firebase Storage');
                await getMetadata(audioRef);
                await deleteObject(audioRef);
                console.log('Audio file deleted from Firebase Storage');
              } catch (storageError) {
                if (storageError.code === 'storage/object-not-found') {
                  console.log('Audio file not found in Firebase Storage, skipping deletion');
                } else {
                  console.error('Error deleting from Firebase Storage:', storageError);
                  throw storageError;
                }
              }

              // 2. Delete from Firebase Realtime Database
              console.log('Deleting from Firebase Realtime Database');
              const voiceNoteDbRef = dbRef(db, `voiceNotes/${auth.currentUser.uid}/${voiceNoteId}`);
              await remove(voiceNoteDbRef);
              console.log('Deleted from Firebase Realtime Database');

              console.log('Voice note deleted successfully');
              navigation.navigate('LibraryScreen', { refresh: true });
            } catch (error) {
              console.error('Error deleting voice note:', error);
              Alert.alert('Error', 'Failed to delete the voice note. Please try again.');
            }
          },
        }
      ]
    );
  };

  const renderScene = SceneMap({
    summary: () => (
      <ScrollView style={styles.tabContent}>
        {summaryLoading ? (
          <>
            {/* <SkeletonParagraph lines={3} />
            <SkeletonParagraph lines={4} lastLineWidth="80%" />
            <SkeletonParagraph lines={3} /> */}
          </>
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
        data={tasksLoading ? [1, 2, 3, 4, 5] : taskArray}
        renderItem={({ item }) => (
          tasksLoading ? (
            <View style={styles.taskItem}>
              <Text style={styles.bullet}>•</Text>
              <SkeletonLine width="90%" style={styles.taskSkeletonLine} />
            </View>
          ) : (
            <View style={styles.taskItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.contentText}>{item.replace(/^[-•]\s*/, '')}</Text>
            </View>
          )
        )}
        keyExtractor={(item, index) => index.toString()}
      />
    ),
    transcript: () => (
      <ScrollView style={styles.tabContent}>
        {transcriptLoading ? (
          <>
            {/* <SkeletonParagraph lines={4} />
            <SkeletonParagraph lines={5} lastLineWidth="60%" />
            <SkeletonParagraph lines={4} />
            <SkeletonParagraph lines={3} lastLineWidth="80%" /> */}
          </>
        ) : (
          transcript.split('.').filter(sentence => sentence.trim().length > 0).map((sentence, index) => (
            <Text key={index} style={styles.contentText}>
              {sentence.trim() + '.'}
            </Text>
          ))
        )}
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
            {formatDateForDisplay(voiceNote.createdDate)}• {voiceNote.location}
          </Text>
        </View>
      </View>

      <View style={styles.playbackContainer}>
        <Playback uri={audioUri} ref={playbackRef} /> 
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
  skeletonLine: {
    height: wp(4),
    backgroundColor: '#2A2B35',
    borderRadius: 4,
  },
  skeletonLineSpacing: {
    marginBottom: 8,
  },
  skeletonParagraph: {
    marginBottom: 20,
  },
  taskSkeletonLine: {
    flex: 1,
    marginLeft: 8,
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
  titleInput: {
    fontSize: wp(5),
    color: '#fff',
    fontWeight: '600',
    padding: 0,
  },
  loadingTitle: {
    color: '#888', // Greyish color
  },
};


// const LoadingTitle = () => {
  //   const opacity = useSharedValue(0.5);
  
  //   useEffect(() => {
  //     opacity.value = withRepeat(
  //       withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
  //       -1,
  //       true
  //     );
  //   }, []);
  
  //   const animatedStyle = useAnimatedStyle(() => ({
  //     opacity: opacity.value,
  //   }));
  
  //   return (
  //     <Animated.Text style={[styles.titleInput, styles.loadingTitle, animatedStyle]}>
  //       Generating title...
  //     </Animated.Text>
  //   );
  // };
  
    // Handle playback status update here if needed
  // }, []);
  

  // Debounce the saveAsyncData function to avoid saving for every character typed
//   const debounceSave = useRef(null);

//   // Save note title only if it changes
//   useEffect(() => {
//     const saveAsyncData = async () => {
//       try {
//         // const existingVoiceNotes = await getVoiceNotesFromLocal(); // Commented out
//         // const updatedVoiceNotes = existingVoiceNotes.map(note => {
//         //   if (note.voiceNoteId === voiceNoteId) {
//         //     return { ...note, title: noteTitle };
//         //   }
//         //   return note;
//         // });
//         // await saveVoiceNotesToLocal(updatedVoiceNotes); // Commented out

//         // navigation.setParams({ voiceNote: { ...voiceNote, title: noteTitle } });
//         console.log('Note title saved:', noteTitle);
//       } catch (error) {
//         console.error('Failed to update note title:', error);
//       }
//     };

//     if (noteTitle !== voiceNote.title) {
//       clearTimeout(debounceSave.current);
//       debounceSave.current = setTimeout(saveAsyncData, 500); // Adjust the delay as needed (e.g., 500 milliseconds)
//     }

//     // Cleanup function to clear timeout if the component unmounts or noteTitle changes
//     return () => clearTimeout(debounceSave.current);
//     }, [noteTitle, voiceNote.title, voiceNoteId]);

    




//   const handleEmojiSelected = async (emoji) => {
//     setNoteEmoji(emoji);
//     setIsEmojiPickerVisible(false);

//     try {
//       // const existingVoiceNotes = await getVoiceNotesFromLocal(); // Commented out
//       // const updatedVoiceNotes = existingVoiceNotes.map(note => {
//       //   if (note.voiceNoteId === voiceNote.voiceNoteId) {
//       //     return { ...note, emoji: emoji };
//       //   }
//       //   return note;
//       // });
//       // await saveVoiceNotesToLocal(updatedVoiceNotes); // Commented out
//     } catch (error) {
//       console.error('Failed to update note emoji:', error);
//     }
//   };

//   const handleBack = () => {
//     navigation.goBack();
//   };

//   const handleShare = () => {
//     // Implement share functionality
//     console.log('Share note');
//   };

//   const handleDelete = () => {
//     Alert.alert(
//       "Delete Note",
//       "Are you sure you want to delete this note?",
//       [
//         {
//           text: "Cancel",
//           style: "cancel"
//         },
//         { 
//           text: "Delete", 
//           onPress: async () => {
//             try {
//               console.log('Starting deletion process for voiceNoteId:', voiceNote.title);
  
//               // 1. Delete from local storage
//               // console.log('Fetching existing voice notes from local storage'); // Commented out
//               // const existingVoiceNotes = await getVoiceNotesFromLocal(); // Commented out
  
//               // const updatedVoiceNotes = existingVoiceNotes.filter(
//               //   note => note.voiceNoteId !== voiceNoteId
//               // );
  
//               // await saveVoiceNotesToLocal(updatedVoiceNotes); // Commented out
//               // console.log('Updated voice notes saved to local storage'); // Commented out
  
//               // 2. Delete from Firebase Storage
//               const audioRef = storageRef(storage, `users/${auth.currentUser.uid}/voiceNotes/${voiceNoteId}`);
//               try {
//                 console.log('Attempting to delete from Firebase Storage');
//                 await getMetadata(audioRef);
//                 await deleteObject(audioRef);
//                 console.log('Audio file deleted from Firebase Storage');
//               } catch (storageError) {
//                 if (storageError.code === 'storage/object-not-found') {
//                   console.log('Audio file not found in Firebase Storage, skipping deletion');
//                 } else {
//                   console.error('Error deleting from Firebase Storage:', storageError);
//                   throw storageError;
//                 }
//               }
  
//               // 3. Delete from Firebase Realtime Database
//               console.log('Deleting from Firebase Realtime Database');
//               const voiceNoteDbRef = dbRef(db, `users/${auth.currentUser.uid}/voiceNotes/${voiceNoteId}`);
//               await remove(voiceNoteDbRef);
//               console.log('Deleted from Firebase Realtime Database');
  
//               console.log('Voice note deleted successfully');
//               navigation.navigate('LibraryScreen', { refresh: true });
//             } catch (error) {
//               console.error('Error deleting voice note:', error);
//               Alert.alert('Error', 'Failed to delete the voice note. Please try again.');
//             }
//           },
//           style: "destructive"
//         }
//       ]
//     );
//   };

//   const renderScene = SceneMap({
//     summary: () => (
//       <ScrollView style={styles.tabContent}>
//         {summaryLoading ? (
//           <>
//             {/* <SkeletonParagraph lines={3} />
//             <SkeletonParagraph lines={4} lastLineWidth="80%" />
//             <SkeletonParagraph lines={3} /> */}
//           </>
//         ) : (
//           summary.split('.').filter(sentence => sentence.trim().length > 0).map((sentence, index) => (
//             <Text key={index} style={styles.contentText}>
//               {sentence.trim() + '.'}
//             </Text>
//           ))
//         )}
//       </ScrollView>
//     ),
//     tasks: () => (
//       <FlatList
//         style={styles.tabContent}
//         data={tasksLoading ? [1, 2, 3, 4, 5] : taskArray}
//         renderItem={({ item }) => (
//           tasksLoading ? (
//             <View style={styles.taskItem}>
//               <Text style={styles.bullet}>•</Text>
//               {/* <SkeletonLine width="90%" style={styles.taskSkeletonLine} /> */}
//             </View>
//           ) : (
//             <View style={styles.taskItem}>
//               <Text style={styles.bullet}>•</Text>
//               <Text style={styles.contentText}>{item.replace(/^[-•]\s*/, '')}</Text>
//             </View>
//           )
//         )}
//         keyExtractor={(item, index) => index.toString()}
//       />
//     ),
//     transcript: () => (
//       <ScrollView style={styles.tabContent}>
//         {transcriptLoading ? (
//           <>
//             {/* <SkeletonParagraph lines={4} />
//             <SkeletonParagraph lines={5} lastLineWidth="60%" />
//             <SkeletonParagraph lines={4} />
//             <SkeletonParagraph lines={3} lastLineWidth="80%" /> */}
//           </>
//         ) : (
//           transcript.split('.').filter(sentence => sentence.trim().length > 0).map((sentence, index) => (
//             <Text key={index} style={styles.contentText}>
//               {sentence.trim() + '.'}
//             </Text>
//           ))
//         )}
//       </ScrollView>
//     ),
//   });

//   const renderTabBar = props => (
//     <TabBar
//       {...props}
//       indicatorStyle={styles.tabIndicator}
//       style={styles.tabBar}
//       labelStyle={styles.tabLabel}
//       renderLabel={({ route, focused }) => (
//         <Text style={[styles.tabLabelText, focused && styles.tabLabelFocused]}>
//           {route.title}
//         </Text>
//       )}
//     />
//   );

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.navigationBar}>
//         <TouchableOpacity onPress={handleBack} style={styles.backButton}>
//           <Ionicons name="chevron-back" size={24} color="#fff" />
//         </TouchableOpacity>
//         <Menu>
//           <MenuTrigger>
//             <Ionicons name="ellipsis-vertical" size={24} color="#fff" style={styles.menuTrigger} />
//           </MenuTrigger>
//           <MenuOptions customStyles={menuOptionsStyles}>
//             <MenuOption onSelect={handleShare}>
//               <View style={styles.menuItem}>
//                 <Ionicons name="share-outline" size={20} color="#fff" />
//                 <Text style={styles.menuText}>Share</Text>
//               </View>
//             </MenuOption>
//             <MenuOption onSelect={handleDelete}>
//               <View style={styles.menuItem}>
//                 <Ionicons name="trash-outline" size={20} color="#FF453A" />
//                 <Text style={[styles.menuText, styles.deleteText]}>Delete</Text>
//               </View>
//             </MenuOption>
//           </MenuOptions>
//         </Menu>
//       </View>

//       <View style={styles.header}>
//         <TouchableOpacity 
//           style={styles.emojiContainer} 
//           onPress={() => setIsEmojiPickerVisible(true)}
//         >
//           <Text style={styles.emoji}>{noteEmoji}</Text>
//         </TouchableOpacity>
//         <View style={styles.titleContainer}>

//             <TextInput
//               style={styles.titleInput}
//               value={noteTitle}
//               onChangeText={setNoteTitle}
//               multiline
//               placeholder="Enter note title"
//               placeholderTextColor="#888"
//             />
    
//           <Text style={styles.dateLocation}>
//             {formatDateForDisplay(voiceNote.createdDate)}• {voiceNote.location}
//           </Text>
//         </View>
//       </View>

//       <View style={styles.playbackContainer}>
//         <Playback uri={audioUri} ref={playbackRef} /> 
//       </View>

//       <TabView
//         navigationState={{ index, routes }}
//         renderScene={renderScene}
//         renderTabBar={renderTabBar}
//         onIndexChange={setIndex}
//         initialLayout={{ width: wp(100) }}
//         style={styles.tabView}
//       />

//       {/* Emoji Picker Modal */}
//       <Modal
//         visible={isEmojiPickerVisible}
//         transparent={true}
//         animationType="slide"
//       >
//         <View style={styles.modalContainer}>
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
//             />
//           </View>
//         </View>
//       </Modal>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#191A23',
//   },
//   container: {
//     flex: 1,
//     backgroundColor: '#191A23',
//   },
//   navigationBar: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderBottomWidth: 1,
//     borderBottomColor: '#242830',
//   },
//   backButton: {
//     padding: 8,
//   },
//   menuItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 12,
//   },
//   menuText: {
//     fontSize: wp(4),
//     color: '#fff',
//     marginLeft: 10,
//   },
//   deleteText: {
//     color: '#FF453A',
//   },
//   menuTrigger: {
//     padding: 8,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#242830',
//   },
//   emojiContainer: {
//     marginRight: 12,
//   },
//   emoji: {
//     fontSize: 32,
//   },
//   titleContainer: {
//     flex: 1,
//   },
//   titleInput: {
//     fontSize: wp(5),
//     color: '#fff',
//     fontWeight: '600',
//     padding: 0,
//   },
//   dateLocation: {
//     fontSize: wp(3.5),
//     color: '#888',
//     marginTop: 4,
//   },
//   playbackContainer: {
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#242830',
//   },
//   tabView: {
//     flex: 1,
//   },
//   tabBar: {
//     backgroundColor: '#191A23',
//     borderBottomWidth: 1,
//     borderBottomColor: '#242830',
//   },
//   tabIndicator: {
//     backgroundColor: '#007AFF',
//   },
//   tabLabel: {
//     fontWeight: '600',
//   },
//   tabLabelText: {
//     color: '#888',
//     fontSize: wp(4),
//   },
//   tabLabelFocused: {
//     color: '#fff',
//   },
//   tabContent: {
//     flex: 1,
//     padding: 16,
//   },
//   contentText: {
//     fontSize: wp(4),
//     color: '#fff',
//     marginBottom: 12,
//     lineHeight: wp(5.5),
//   },
//   taskItem: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     marginBottom: 12,
//   },
//   bullet: {
//     fontSize: wp(4),
//     color: '#fff',
//     marginRight: 8,
//   },
//   modalContainer: {
//     flex: 1,
//     justifyContent: 'flex-end',
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//   },
//   modalContent: {
//     backgroundColor: '#242830',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     height: height * 0.6,
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#191A23',
//   },
//   modalHeaderTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#fff',
//   },
//   closeButton: {
//     fontSize: 16,
//     color: '#007AFF',
//   },
//   emojiPicker: {
//     flex: 1,
//   },
//   skeletonLine: {
//     height: wp(4),
//     backgroundColor: '#2A2B35',
//     borderRadius: 4,
//   },
//   skeletonLineSpacing: {
//     marginBottom: 8,
//   },
//   skeletonParagraph: {
//     marginBottom: 20,
//   },
//   taskSkeletonLine: {
//     flex: 1,
//     marginLeft: 8,
//   },
// });

// const menuOptionsStyles = {
//   optionsContainer: {
//     backgroundColor: '#242830',
//     borderRadius: 10,
//     padding: 5,
//     width: 150,
//   },
//   optionWrapper: {
//     borderBottomWidth: 1,
//     borderBottomColor: '#191A23',
//   },
//   optionTouchable: {
//     underlayColor: 'rgba(255, 255, 255, 0.1)',
//     activeOpacity: 70,
//   },
//   titleInput: {
//     fontSize: wp(5),
//     color: '#fff',
//     fontWeight: '600',
//     padding: 0,
//   },
//   loadingTitle: {
//     color: '#888', // Greyish color
//   },
// };


// // const LoadingTitle = () => {
//   //   const opacity = useSharedValue(0.5);
  
//   //   useEffect(() => {
//   //     opacity.value = withRepeat(
//   //       withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
//   //       -1,
//   //       true
//   //     );
//   //   }, []);
  
//   //   const animatedStyle = useAnimatedStyle(() => ({
//   //     opacity: opacity.value,
//   //   }));
  
//   //   return (
//   //     <Animated.Text style={[styles.titleInput, styles.loadingTitle, animatedStyle]}>
//   //       Generating title...
//   //     </Animated.Text>
//   //   );
//   // };
  