import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, SafeAreaView, Text, TouchableOpacity, View, Alert } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { FlatList } from 'react-native-gesture-handler';
import { auth, db, updateVoiceNote, remove, functions, storage, deleteObject } from '../../config/firebase';
import { ref, onValue, off } from 'firebase/database';
import { formatDateForDisplay } from '../utilities/helpers';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import SoloVoiceNoteItem from '../components/SoloSessionItem';
import GuidedSessionItem from '../components/GuidedSessionItem';
import { httpsCallable } from 'firebase/functions';

export default function LibraryScreen({ navigation }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const route = useRoute();

  const navigateToSettings = () => {
    navigation.navigate('SettingsScreen');
  };

  const fetchVoiceNotes = useCallback((voiceNotesRef) => {
    return new Promise((resolve, reject) => {
      try {
        onValue(voiceNotesRef, (snapshot) => {
          let firebaseNotes = [];
          if (snapshot.exists()) {
            firebaseNotes = Object.entries(snapshot.val()).map(([id, note]) => ({
              id: note.voiceNoteId || id,
              createdDate: note.createdDate || new Date().toISOString(),
              title: note.title || 'Untitled Note',
              status: note.status || 'completed',
              processingStartedAt: note.processingStartedAt || null,
              errorDetails: note.errorDetails || null,
              type: 'solo',
              image: note.image || null,
              summary: note.summary || null,
              location: note.location || null
            }));
          }
          resolve(firebaseNotes);
        }, {
          onlyOnce: true
        });
      } catch (error) {
        reject(error);
      }
    });
  }, []);

  const fetchGuidedSessions = useCallback((guidedSessionsRef) => {
    return new Promise((resolve, reject) => {
      try {
        onValue(guidedSessionsRef, (snapshot) => {
          let guidedNotes = [];
          if (snapshot.exists()) {
            guidedNotes = Object.entries(snapshot.val()).map(([id, session]) => ({
              id,
              guidedSessionId: id,
              createdDate: session.dateCreated,
              title: session.title || 'Title pending',
              guideId: session.guideId,
              guideName: session.guideName,
              moduleName: session.moduleName,
              type: 'guided',
              status: session.status,
              summary: session.summary
            }));
          }
          resolve(guidedNotes);
        }, {
          onlyOnce: true
        });
      } catch (error) {
        reject(error);
      }
    });
  }, []);

  const fetchSessions = useCallback(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const voiceNotesRef = ref(db, `/voiceNotes/${userId}`);
    const guidedSessionsRef = ref(db, `/guidedSessions/${userId}`);

    setLoading(true);
    Promise.all([fetchVoiceNotes(voiceNotesRef), fetchGuidedSessions(guidedSessionsRef)])
      .then(([voiceNotes, guidedSessions]) => {
        const combinedSessions = [...voiceNotes, ...guidedSessions];
        setSessions(sortSessionsChronologically(combinedSessions));
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching sessions:', error);
        Alert.alert('Error', 'Failed to load sessions. Please try again.');
        setLoading(false);
      });
  }, [fetchVoiceNotes, fetchGuidedSessions]);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      setLoading(false);
      return;
    }

    const voiceNotesRef = ref(db, `/voiceNotes/${userId}`);
    const guidedSessionsRef = ref(db, `/guidedSessions/${userId}`);

    // Set up listeners for real-time updates
    const voiceNotesListener = onValue(voiceNotesRef, (snapshot) => {
      let firebaseNotes = [];
      if (snapshot.exists()) {
        firebaseNotes = Object.entries(snapshot.val()).map(([id, note]) => ({
          id: note.voiceNoteId || id,
          createdDate: note.createdDate || new Date().toISOString(),
          title: note.title || 'Untitled Note',
          status: note.status || 'completed',
          processingStartedAt: note.processingStartedAt || null,
          errorDetails: note.errorDetails || null,
          type: 'solo',
          image: note.image || null,
          summary: note.summary || null,
          location: note.location || null
        }));
      }
      
      setSessions(prevSessions => {
        const guidedSessions = prevSessions.filter(session => session.type === 'guided');
        return sortSessionsChronologically([...guidedSessions, ...firebaseNotes]);
      });
    });

    const guidedSessionsListener = onValue(guidedSessionsRef, (snapshot) => {
      let guidedNotes = [];
      if (snapshot.exists()) {
        guidedNotes = Object.entries(snapshot.val()).map(([id, session]) => ({
          id,
          guidedSessionId: id,
          createdDate: session.dateCreated,
          title: session.title || 'Title pending',
          guideId: session.guideId,
          guideName: session.guideName,
          moduleName: session.moduleName,
          type: 'guided',
          status: session.status,
          summary: session.summary
        }));
      }

      setSessions(prevSessions => {
        const voiceNotes = prevSessions.filter(session => session.type === 'solo');
        return sortSessionsChronologically([...voiceNotes, ...guidedNotes]);
      });
    });

    // Initial load
    Promise.all([
      fetchVoiceNotes(voiceNotesRef),
      fetchGuidedSessions(guidedSessionsRef)
    ])
      .then(([voiceNotes, guidedSessions]) => {
        const combinedSessions = [...voiceNotes, ...guidedSessions];
        setSessions(sortSessionsChronologically(combinedSessions));
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching sessions:', error);
        Alert.alert('Error', 'Failed to load sessions. Please try again.');
        setLoading(false);
      });

    // Cleanup listeners
    return () => {
      off(voiceNotesRef);
      off(guidedSessionsRef);
    };
  }, [fetchVoiceNotes, fetchGuidedSessions]);

  useFocusEffect(
    useCallback(() => {
      if (route.params?.refresh) {
        fetchSessions();
        navigation.setParams({ refresh: undefined });
      }
    }, [route.params?.refresh, fetchSessions, navigation])
  );

  const sortSessionsChronologically = (sessions) => {
    return sessions.sort((b, a) => new Date(a.createdDate) - new Date(b.createdDate));
  };

  const handleRetry = async (voiceNoteId) => {
    if (isRetrying) return; // Prevent multiple retries

    console.log(`Attempting to retry processing for voice note ID: ${voiceNoteId}`);
    setIsRetrying(true);
    
    try {
      // Call a Cloud Function using the imported 'functions' instance
      const retryFunction = httpsCallable(functions, 'retryVoiceNoteProcessing'); 
      const result = await retryFunction({ voiceNoteId });

      // Get the voice note data
      const voiceNoteRef = ref(db, `voiceNotes/${auth.currentUser.uid}/${voiceNoteId}`);
      const snapshot = await get(voiceNoteRef);
      
      if (snapshot.exists()) {
        const voiceNote = snapshot.val();
        
        // Update status back to processing
        await updateVoiceNote(auth.currentUser.uid, voiceNoteId, {
          status: 'processing',
          lastRetry: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error calling retry function:', error); // The error log you saw
      Alert.alert('Retry Error', 'Failed to re-initiate processing. Please try again later.');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleDelete = async (voiceNoteId) => {
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
            try {
              // Delete from Firebase Database
              const voiceNoteRef = ref(db, `voiceNotes/${auth.currentUser.uid}/${voiceNoteId}`);
              await remove(voiceNoteRef);
              
              // Delete from Firebase Storage
              const storageRef = ref(storage, `users/${auth.currentUser.uid}/voiceNotes/${voiceNoteId}`);
              await deleteObject(storageRef);
              
              // Update local state
              setSessions(prev => prev.filter(session => session.id !== voiceNoteId));
            } catch (error) {
              console.error('Error deleting voice note:', error);
              Alert.alert('Error', 'Failed to delete recording. Please try again.');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => {
    if (item.type === 'solo') {
      const isLoading = item.status === 'recording' || item.status === 'processing';
      const onPress = () => {
        if (item.status === 'completed') {
          navigation.navigate('VoiceNoteDetails', { voiceNote: item });
        }
      };

      return (
        <SoloVoiceNoteItem
          item={item}
          onPress={onPress}
          onRetry={() => handleRetry(item.id)}
          onDelete={() => handleDelete(item.id)}
          enableMapClick={false}
        />
      );
    } else if (item.type === 'guided') {
      const onPress = () => {
        navigation.navigate('VoiceNoteDetails', { voiceNote: item });
      };

      return (
        <GuidedSessionItem
          item={item}
          onPress={onPress}
        />
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIcon} onPress={navigateToSettings}>
          <MaterialCommunityIcons name="view-grid" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Ramblings Library</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="notifications-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.subHeader}>
        <Text style={styles.subHeaderText}>Your Ramblings</Text>
        <View style={styles.viewOptions}>
          <TouchableOpacity style={styles.viewOptionButton}>
            <MaterialCommunityIcons name="view-list" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.viewOptionButton}>
            <MaterialCommunityIcons name="view-grid" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderItem}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          contentContainerStyle={styles.listContent}
          style={styles.flatList}
        />
      )}
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
  },
  title: {
    fontSize: wp(5),
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  subHeaderText: {
    fontSize: wp(4),
    fontWeight: 'bold',
  },
  viewOptions: {
    flexDirection: 'row',
  },
  viewOptionButton: {
    marginLeft: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  flatList: {
    backgroundColor: '#F9F9F9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: wp(4),
    color: '#666',
  },
});
