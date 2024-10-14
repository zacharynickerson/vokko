import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, SafeAreaView, Text, TouchableOpacity, View, TextInput, Alert, ScrollView, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { auth, db } from '../../config/firebase';
import { ref as dbRef, onValue, remove } from 'firebase/database';
import SoloVoiceNoteItem from '../components/SoloSessionItem';
import GuidedSessionItem from '../components/GuidedSessionItem';
import { formatDateForDisplay } from '../utilities/helpers';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

export default function VoiceNoteDetails({ route, navigation }) {
  const { voiceNote } = route.params;
  const { voiceNoteId } = voiceNote;

  const [noteTitle, setNoteTitle] = useState('');
  const [transcript, setTranscript] = useState('');
  const [audioUri, setAudioUri] = useState(null);
  const playbackRef = useRef(null);

  useEffect(() => {
    const noteRef = dbRef(db, `voiceNotes/${auth.currentUser.uid}/${voiceNoteId}`);
    
    const unsubscribe = onValue(noteRef, (snapshot) => {
      if (snapshot.exists()) {
        const noteData = snapshot.val();
        setTranscript(noteData.transcript || '');
        setNoteTitle(noteData.title || '');
        setAudioUri(noteData.audioUri || null);
      }
    }, (error) => {
      console.error('Error fetching note details:', error);
    });

    return () => unsubscribe();
  }, [voiceNoteId]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleDelete = async () => {
    try {
      const voiceNoteDbRef = dbRef(db, `voiceNotes/${auth.currentUser.uid}/${voiceNoteId}`);
      await remove(voiceNoteDbRef);
      navigation.navigate('LibraryScreen', { refresh: true });
    } catch (error) {
      console.error('Error deleting voice note:', error);
      Alert.alert('Error', 'Failed to delete the voice note. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIcon} onPress={handleBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
        <View style={styles.headerRightIcons}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="paper-plane-outline" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="ellipsis-vertical" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.sessionItemContainer}>
          {voiceNote.guideName ? (
            <GuidedSessionItem item={voiceNote} />
          ) : (
            <SoloVoiceNoteItem item={voiceNote} />
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.contentContainer}>
          <Text style={styles.transcriptHeader}>Transcript</Text>
          <Text style={styles.transcriptText}>
            {transcript.split('\n\n').map((paragraph, index) => (
              <Text key={index}>
                {paragraph}
                {'\n\n'}
              </Text>
            ))}
          </Text>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.editButton} onPress={() => console.log('Edit pressed')}>
        <Ionicons name="create-outline" size={24} color="#4FBF67" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    
  },
  headerIcon: {
    width: 24,
    marginLeft: 10,
  },
  headerRightIcons: {
    flexDirection: 'row',
  },
  scrollView: {
    flex: 1,
    
  },
  sessionItemContainer: {
    paddingHorizontal: 10,
    marginBottom: -10,
    // backgroundColor: 'red',


  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 20,
    marginBottom: 10,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  transcriptHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4FBF67',
    marginBottom: 8,
  },
  transcriptText: {
    fontSize: 16,
    color: '#808080',
    lineHeight: 24,
  },
  editButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    padding: 12,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#4FBF67',
  },
});
