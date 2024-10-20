import React, { useEffect, useState, useRef, useMemo } from 'react';
import { StyleSheet, SafeAreaView, Text, TouchableOpacity, View, TextInput, Alert, ScrollView, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { auth, db } from '../../config/firebase';
import { ref as dbRef, onValue, remove } from 'firebase/database';
import SoloVoiceNoteItem from '../components/SoloSessionItem';
import GuidedSessionItem from '../components/GuidedSessionItem';
import { formatDateForDisplay } from '../utilities/helpers';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import RenderHtml from 'react-native-render-html';
import { useWindowDimensions } from 'react-native';

export default function VoiceNoteDetails({ route, navigation }) {
  const { voiceNote } = route.params;
  const { voiceNoteId } = voiceNote;

  const [noteTitle, setNoteTitle] = useState('');
  const [formattedNote, setFormattedNote] = useState('');
  const [audioUri, setAudioUri] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const playbackRef = useRef(null);

  const { width } = useWindowDimensions();

  const formatNoteContent = (content) => {
    // Convert **text** to <strong>text</strong>
    let formattedContent = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert newlines to <br> tags
    formattedContent = formattedContent.replace(/\n/g, '<br>');

    return formattedContent;
  };



  useEffect(() => {
    const noteRef = dbRef(db, `voiceNotes/${auth.currentUser.uid}/${voiceNoteId}`);
    
    const unsubscribe = onValue(noteRef, (snapshot) => {
      if (snapshot.exists()) {
        const noteData = snapshot.val();
        setFormattedNote(noteData.summary || 'Note unavailable'); // Use summary for formatted note
        setNoteTitle(noteData.title || '');
        setAudioUri(noteData.chunks[0]?.url || null); // Access the first chunk's URL
      }
    }, (error) => {
      console.error('Error fetching note details:', error);
    });

    return () => unsubscribe();
  }, [voiceNoteId]);

  const handleBack = () => {
    navigation.goBack();
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
          text: "Yes", 
          onPress: async () => {
            try {
              const voiceNoteDbRef = dbRef(db, `voiceNotes/${auth.currentUser.uid}/${voiceNoteId}`);
              await remove(voiceNoteDbRef);
              navigation.navigate('LibraryScreen', { refresh: true });
            } catch (error) {
              console.error('Error deleting voice note:', error);
              Alert.alert('Error', 'Failed to delete the voice note. Please try again.');
            }
          }
        }
      ]
    );
  };

  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };

  const formattedHtml = useMemo(() => formatNoteContent(formattedNote), [formattedNote]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerIcon} onPress={handleBack}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="black" />
          </TouchableOpacity>
          <View style={styles.headerRightIcons}>
            <TouchableOpacity style={styles.headerIcon}>
              <Ionicons name="paper-plane-outline" size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon} onPress={toggleOptions}>
              <Ionicons name="ellipsis-vertical" size={24} color="black" />
            </TouchableOpacity>
          </View>
        </View>

        {showOptions && (
          <View style={styles.optionsMenu}>
            <TouchableOpacity style={styles.optionItem} onPress={handleDelete}>
              <Text style={styles.optionText}>Delete Note</Text>
            </TouchableOpacity>
            {/* Add more options here if needed */}
          </View>
        )}
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
          <RenderHtml
            contentWidth={width}
            source={{ html: formattedHtml || 'Note unavailable' }}
            tagsStyles={styles.tagsStyles}
            baseStyle={styles.formattedNoteText}
          />
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
  headerContainer: {
    zIndex: 1000,
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
  formattedNoteHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4FBF67',
    marginBottom: 8,
  },
  formattedNoteText: {
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
  optionsMenu: {
    position: 'absolute',
    top: '100%',
    right: 10,
    backgroundColor: 'white',
    borderRadius: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  optionItem: {
    padding: 10,
  },
  optionText: {
    fontSize: 16,
  },
  tagsStyles: {
    strong: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#4FBF67',
    },
  },
});

const tagsStyles = {
  body: {
    fontSize: 16,
    color: '#808080',
    lineHeight: 24,
  },
  p: {
    marginBottom: 10, // Add space between paragraphs
  },
  h3: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4FBF67',
    marginTop: 20,
    marginBottom: 10,
  },
  strong: {
    fontWeight: 'bold',
    color: '#4FBF67',
  },
};
