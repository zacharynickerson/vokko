import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, SafeAreaView, Text, TouchableOpacity, View, Alert } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { FlatList } from 'react-native-gesture-handler';
import { auth, db } from '../../config/firebase';
import { ref, onValue, off } from 'firebase/database';
// import { getVoiceNotesFromLocal, saveVoiceNotesToLocal } from '../utilities/voiceNoteLocalStorage'; // Commented out
import { formatDateForDisplay } from '../utilities/helpers';
import { Entypo } from '@expo/vector-icons'; // Add this import

export default function LibraryScreen() {
  const [voiceNotes, setVoiceNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const route = useRoute();
  const [userName, setUserName] = useState('');

  const navigateToSettings = () => {
    navigation.navigate('SettingsScreen');
  };

  const fetchVoiceNotes = useCallback(async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      setLoading(false);
      return;
    }

    const voiceNotesRef = ref(db, `/voiceNotes/${userId}`); // Updated path

    const onDataChange = async (snapshot) => {
      try {
        setLoading(true);
        let firebaseNotes = [];
        if (snapshot.exists()) {
          firebaseNotes = Object.values(snapshot.val()).map(note => {
            return {
              ...note,
              voiceNoteId: note.voiceNoteId || extractVoiceNoteIdFromUri(note.audioFileUri)
            };
          }).filter(note => note !== null);
        }

        // Sort notes chronologically
        const sortedNotes = sortNotesChronologically(firebaseNotes);

        setVoiceNotes(sortedNotes); // Use sortedNotes directly
      } catch (error) {
        console.error('Error processing voice notes:', error);
        Alert.alert('Error', 'Failed to load voice notes. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    onValue(voiceNotesRef, onDataChange, (error) => {
      console.error('Firebase onValue error:', error);
      setLoading(false);
    });

    // Cleanup function
    return () => off(voiceNotesRef);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (route.params?.refresh) {
        fetchVoiceNotes();
        // Reset the refresh parameter
        navigation.setParams({ refresh: undefined });
      }
    }, [route.params?.refresh, fetchVoiceNotes, navigation])
  );

  useEffect(() => {
    fetchVoiceNotes();
  }, [fetchVoiceNotes]);

  // const mergeAndSortNotes = (localNotes, firebaseNotes) => { // Commented out
  //   const mergedNotes = [...localNotes, ...firebaseNotes].reduce((acc, note) => {
  //     const existingNote = acc.find(n => n.voiceNoteId === note.voiceNoteId);
  //     if (!existingNote) {
  //       acc.push(note);
  //     } else {
  //       const mergedNote = {
  //         ...existingNote,
  //         ...note,
  //         localUri: existingNote.localUri || note.localUri
  //       };
  //       const index = acc.indexOf(existingNote);
  //       acc[index] = mergedNote;
  //     }
  //     return acc;
  //   }, []);
  
  //   // Sort notes by createdDate in descending order (most recent first)
  //   return mergedNotes.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
  // };

  // Helper function to extract voiceNoteId from URI
  const extractVoiceNoteIdFromUri = (uri) => {
    if (!uri) {
      console.error('URI is undefined');
      return null;
    }
    const parts = uri.split('/');
    const filename = parts.pop();
    return filename ? filename.split('.')[0] : null;
  };

  const sortNotesChronologically = (notes) => {
    return notes.sort((b, a) => new Date(a.createdDate) - new Date(b.createdDate));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>       
       <View style={styles.titleContainer}>
       <Text style={styles.greeting}>{userName ? `Hello ${userName}` : 'Hello'} </Text>
        <TouchableOpacity onPress={navigateToSettings}>
          <Entypo name="cog" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
        <Text style={styles.title}>Voice Notes</Text>
      </View>
      <FlatList
        data={voiceNotes.filter(note => note && note.audioFileUri)}
        keyExtractor={(item) => item?.voiceNoteId || ''}
        renderItem={({ item }) => (
          item ? (
            <TouchableOpacity onPress={() => navigation.navigate('VoiceNoteDetails', { voiceNote: item })}>
              <View style={styles.itemContainer}>
                <View style={styles.iconContainer}>
                  <Text style={{ fontSize: 24 }}>{item.emoji || '🎙️'}</Text>
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                    {item.title}
                  </Text>
                  <Text style={styles.dateLocation} numberOfLines={1}>
                    {formatDateForDisplay(item.createdDate)} • {item.location}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ) : null
        )}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#191A23',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  greeting: {
    fontSize: wp(3.7),
    color: '#888',
    marginBottom: 8,
  },
  title: {
    fontSize: wp(5),
    color: '#fff',
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: wp(4),
    color: '#fff',
    fontWeight: '500',
  },
  dateLocation: {
    fontSize: wp(3.5),
    color: '#888',
    marginTop: 4,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
