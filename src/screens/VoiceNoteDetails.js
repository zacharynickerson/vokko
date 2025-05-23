import React, { useEffect, useState, useRef, useMemo } from 'react';
import { StyleSheet, SafeAreaView, Text, TouchableOpacity, View, Alert, ScrollView, Image, Clipboard, Linking, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { auth, db, updateVoiceNote } from '../../config/firebase';
import { ref as dbRef, onValue, remove, get, update } from 'firebase/database';
import SoloVoiceNoteItem from '../components/SoloSessionItem';
import RenderHtml from 'react-native-render-html';
import { useWindowDimensions } from 'react-native';
import PropTypes from 'prop-types';
import { getStaticMapUrl } from '../config/maps';
import { sendToAI } from '../utils/integrations';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useNavigation, useRoute } from '@react-navigation/native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

export default function VoiceNoteDetails() {
  const navigation = useNavigation();
  const route = useRoute();
  const { voiceNote } = route.params;
  const { id, location } = voiceNote;

  const [noteTitle, setNoteTitle] = useState('');
  const [formattedNote, setFormattedNote] = useState('');
  const [audioUri, setAudioUri] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const playbackRef = useRef(null);

  const { width } = useWindowDimensions();

  const [isRetrying, setIsRetrying] = useState(false);
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const mapImageUrl = useMemo(() => {
    if (!location?.latitude || !location?.longitude) return null;
    return getStaticMapUrl(location.latitude, location.longitude);
  }, [location]);

  const formatNoteContent = (content) => {
    if (!content) return 'Note unavailable';
    // Convert **text** to <strong>text</strong>
    let formattedContent = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert newlines to <br> tags
    formattedContent = formattedContent.replace(/\n/g, '<br>');

    return formattedContent;
  };

  useEffect(() => {
    console.log('=== VoiceNoteDetails useEffect START ===');
    console.log('voiceNote:', voiceNote);
    console.log('noteId:', id);

    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const noteRef = dbRef(db, `/voiceNotes/${userId}/${id}`);

    console.log('Firebase path:', `/voiceNotes/${userId}/${id}`);

    // Fetch note details from Firebase
    const unsubscribe = onValue(noteRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setNoteTitle(data.title || 'Untitled Note');
        setFormattedNote(data.summary || 'Note unavailable');
        setAudioUri(data.audioUri || null);
      }
    }, (error) => {
      console.error('Error fetching note details:', error);
      Alert.alert('Error', 'Failed to load note details.');
    });

    return () => unsubscribe();
  }, [id, navigation]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleDelete = async () => {
    Alert.alert(
      "Delete Recording",
      "Are you sure you want to delete this recording? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              const voiceNoteRef = dbRef(db, `voiceNotes/${auth.currentUser.uid}/${voiceNote.id}`);
              await remove(voiceNoteRef);
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting voice note:', error);
              Alert.alert('Error', 'Failed to delete recording. Please try again.');
            } finally {
              setIsDeleting(false);
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

  const handleRetry = async () => {
    if (isRetrying) return;
    
    setIsRetrying(true);
    console.log(`Attempting to retry processing for voice note ID: ${id}`);
    
    try {
      await updateVoiceNote(auth.currentUser.uid, id, {
        status: 'processing',
        lastRetry: new Date().toISOString()
      });
      
      Alert.alert('Retry Initiated', 'The voice note processing has been restarted.');
    } catch (error) {
      console.error('Error retrying processing:', error);
      Alert.alert('Error', 'Failed to retry processing. Please try again later.');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleCopyToClipboard = () => {
    const formattedDate = new Date(voiceNote.createdDate).toLocaleDateString();
    const textToCopy = `${noteTitle}\n${formattedDate}\n\n${formattedNote.replace(/<[^>]*>/g, '')}`;
    
    Clipboard.setString(textToCopy);
    setShowCopyFeedback(true);
    setTimeout(() => setShowCopyFeedback(false), 800);
  };

  const handleSendToAI = async (aiService) => {
    let deepLink, webUrl, appName;
    if (aiService === 'chatgpt') {
      deepLink = 'chatgpt://';
      webUrl = 'https://chat.openai.com/';
      appName = 'ChatGPT';
    } else if (aiService === 'claude') {
      deepLink = 'claude://';
      webUrl = 'https://claude.ai/';
      appName = 'Claude';
    }

    // Copy note text to clipboard
    Clipboard.setString(formattedNote.replace(/<[^>]*>/g, ''));

    try {
      const supported = await Linking.canOpenURL(deepLink);
      if (supported) {
        await Linking.openURL(deepLink);
        Alert.alert(
          `${appName} Opened`,
          'Your note text has been copied. Just paste it into the chat!'
        );
      } else {
        await Linking.openURL(webUrl);
        Alert.alert(
          `${appName} Web Opened`,
          'Your note text has been copied. Just paste it into the chat!'
        );
      }
    } catch (error) {
      Alert.alert('Error', `Could not open ${appName}. Your note text has been copied, so you can paste it manually.`);
    }
  };

  WebBrowser.maybeCompleteAuthSession();

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: '793156853153-4b0ji8gmd0hdkpb6tv1nto1mmfl945e4.apps.googleusercontent.com',
    iosClientId: '793156853153-168gt88b3jmk0di9k02v71fkmnaa0oaj.apps.googleusercontent.com',
    androidClientId: '793156853153-1h9hm9i443ar5d1mn691k4beh033l8p2.apps.googleusercontent.com',
    webClientId: '793156853153-4b0ji8gmd0hdkpb6tv1nto1mmfl945e4.apps.googleusercontent.com',
    scopes: [
      'profile',
      'email',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/documents'
    ],
  });

  const handleSendToGoogleDocs = async () => {
    const result = await promptAsync();
    if (result.type === 'success') {
      const accessToken = result.authentication.accessToken;
      try {
        // 1. Create the document
        const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: noteTitle || 'New Note from App',
          }),
        });
        const doc = await createRes.json();

        // 2. Insert the note text
        await fetch(`https://docs.googleapis.com/v1/documents/${doc.documentId}:batchUpdate`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                insertText: {
                  location: { index: 1 },
                  text: formattedNote.replace(/<[^>]*>/g, ''),
                },
              },
            ],
          }),
        });

        // 3. Open the doc in browser
        const docUrl = `https://docs.google.com/document/d/${doc.documentId}/edit`;
        Linking.openURL(docUrl);
      } catch (err) {
        Alert.alert('Error', 'Failed to create Google Doc.');
      }
    } else {
      Alert.alert('Error', 'Google authentication failed or was cancelled.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerIcon} onPress={handleBack}>
            <Ionicons name="close" size={24} color="black" />
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
            <TouchableOpacity style={styles.optionItem} onPress={() => handleSendToAI('chatgpt')}>
              <Text style={styles.optionText}>Send to ChatGPT</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionItem} onPress={() => handleSendToAI('claude')}>
              <Text style={styles.optionText}>Send to Claude</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionItem} onPress={handleDelete}>
              <Text style={styles.optionText}>Delete Note</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionItem} onPress={handleSendToGoogleDocs}>
              <Text style={styles.optionText}>Send to Google Docs</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.sessionItemContainer}>
          <SoloVoiceNoteItem
            item={voiceNote}
            onRetry={handleRetry}
            onDelete={handleDelete}
            isLoading={isRetrying}
            enableMapClick={false}
            isDetailView={true}
          />
        </View>

        <View style={styles.contentContainer}>
          <RenderHtml
            contentWidth={width - 40} // Adjusted for padding
            source={{ html: formattedHtml }}
            tagsStyles={tagsStyles}
            baseStyle={styles.formattedNoteText}
          />
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.editButton} onPress={handleCopyToClipboard}>
        <MaterialCommunityIcons 
          name={showCopyFeedback ? "check" : "content-copy"} 
          size={24} 
          color="#4FBF67" 
        />
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
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
    minWidth: 200,
  },
  optionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  optionText: {
    fontSize: 16,
    color: '#2C2E33',
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

VoiceNoteDetails.propTypes = {
  route: PropTypes.shape({
    params: PropTypes.shape({
      voiceNote: PropTypes.shape({
        id: PropTypes.string.isRequired,
        location: PropTypes.shape({
          latitude: PropTypes.number,
          longitude: PropTypes.number,
        }),
        createdDate: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
  navigation: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

