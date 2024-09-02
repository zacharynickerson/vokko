import React, { useState } from 'react';
import { StyleSheet, ActivityIndicator, SafeAreaView, Text, TouchableOpacity, View, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { FlatList } from 'react-native-gesture-handler';
import { auth, db } from '../../config/firebase';
import { ref, get } from 'firebase/database';
import { getVoiceNotesFromLocal, saveVoiceNotesToLocal } from '../utilities/voiceNoteLocalStorage';

export default function LibraryScreen() {
  const [voiceNotes, setVoiceNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const [userName, setUserName] = useState('');

  const fetchVoiceNotes = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      console.log('Fetching local notes...');
      const localNotes = await getVoiceNotesFromLocal();
      // console.log('Local notes:', localNotes);
      
      console.log('Fetching Firebase notes...');
      // Updated path to match your database structure
      const voiceNotesRef = ref(db, `/users/${userId}/voiceNotes`);
      const snapshot = await get(voiceNotesRef);
      let firebaseNotes = [];
      if (snapshot.exists()) {
        firebaseNotes = Object.values(snapshot.val());
        // console.log('Firebase notes:', firebaseNotes);
      } else {
        console.log('No Firebase notes found');
      }
      
      // Merge local and Firebase notes, preferring Firebase data
      const mergedNotes = [...localNotes, ...firebaseNotes].reduce((acc, note) => {
        const existingNote = acc.find(n => n.voiceNoteId === note.voiceNoteId);
        if (!existingNote) {
          acc.push(note);
        } else if (new Date(note.createdDate) > new Date(existingNote.createdDate)) {
          const index = acc.indexOf(existingNote);
          acc[index] = note;
        }
        return acc;
      }, []);

      // console.log('Merged notes:', mergedNotes);

      // Sort the notes by createdDate in descending order
      const sortedNotes = mergedNotes.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
      
      await saveVoiceNotesToLocal(sortedNotes);
      
      setVoiceNotes(sortedNotes);
    } catch (error) {
      console.error('Failed to load voice notes:', error);
      console.error('Error details:', error.message);
      if (error.code) {
        console.error('Firebase error code:', error.code);
      }
      Alert.alert(
        'Error',
        `Failed to load voice notes: ${error.message}. Please check your internet connection and try again.`,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchVoiceNotes();
    }, [])
  );



  return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {userName ? `Hello ${userName}` : 'Hello'}
          </Text>
          <Text style={styles.title}>Voice Notes</Text>
        </View>
        <FlatList
          data={voiceNotes.filter(note => note && note.uri)}
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
                      {item.createdDate} • {item.location}
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
});



