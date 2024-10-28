import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, SafeAreaView, Text, TouchableOpacity, View, Alert } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { FlatList } from 'react-native-gesture-handler';
import { auth, db } from '../../config/firebase';
import { ref, onValue, off } from 'firebase/database';
import { formatDateForDisplay } from '../utilities/helpers';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import SoloVoiceNoteItem from '../components/SoloSessionItem';
import GuidedSessionItem from '../components/GuidedSessionItem';

export default function LibraryScreen({ navigation }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const route = useRoute();

  const navigateToSettings = () => {
    navigation.navigate('SettingsScreen');
  };

  const fetchSessions = useCallback(async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      setLoading(false);
      return;
    }

    const voiceNotesRef = ref(db, `/voiceNotes/${userId}`);
    const guidedSessionsRef = ref(db, `/guidedSessions/${userId}`);

    const fetchVoiceNotes = () => {
      return new Promise((resolve, reject) => {
        const voiceNotesListener = onValue(voiceNotesRef, (snapshot) => {
          try {
            let firebaseNotes = [];
            if (snapshot.exists()) {
              firebaseNotes = Object.values(snapshot.val()).map(note => ({
                id: note.voiceNoteId || note.id,
                createdDate: note.createdDate || new Date().toISOString(),
                title: note.title || 'Untitled Note',
                status: note.status || 'completed',
                type: 'solo',
                image: note.image || null,
              }));
            }
            resolve(firebaseNotes);
          } catch (error) {
            reject(error);
          }
        }, (error) => {
          reject(error);
        });

        // Cleanup listener
        return () => off(voiceNotesRef, 'value', voiceNotesListener);
      });
    };

    const fetchGuidedSessions = () => {
      return new Promise((resolve, reject) => {
        const guidedSessionsListener = onValue(guidedSessionsRef, (snapshot) => {
          try {
            let guidedNotes = [];
            if (snapshot.exists()) {
              guidedNotes = Object.values(snapshot.val()).map(session => ({
                id: session.guidedSessionId || session.id,
                createdDate: session.createdDate || new Date().toISOString(),
                title: session.title || 'Untitled Session',
                coachAvatar: session.coachAvatar || null,
                coachName: session.coachName || 'Coach',
                moduleName: session.moduleName || 'Module',
                type: 'guided',
                image: session.image || null,
              }));
            }
            resolve(guidedNotes);
          } catch (error) {
            reject(error);
          }
        }, (error) => {
          reject(error);
        });

        // Cleanup listener
        return () => off(guidedSessionsRef, 'value', guidedSessionsListener);
      });
    };

    try {
      setLoading(true);
      const [voiceNotes, guidedSessions] = await Promise.all([fetchVoiceNotes(), fetchGuidedSessions()]);

      const combinedSessions = [...voiceNotes, ...guidedSessions];
      const sortedSessions = sortSessionsChronologically(combinedSessions);
      setSessions(sortedSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      Alert.alert('Error', 'Failed to load sessions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (route.params?.refresh) {
        fetchSessions();
        navigation.setParams({ refresh: undefined });
      }
    }, [route.params?.refresh, fetchSessions, navigation])
  );

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const sortSessionsChronologically = (sessions) => {
    return sessions.sort((b, a) => new Date(a.createdDate) - new Date(b.createdDate));
  };

  const renderItem = ({ item }) => {
    if (item.type === 'solo') {
      const isLoading = item.status === 'recording' || item.status === 'processing';
      const onPress = () => {
        if (item.status === 'completed' || item.status === 'error') {
          navigation.navigate('VoiceNoteDetails', { voiceNote: item });
        }
      };

      return (
        <SoloVoiceNoteItem
          item={item}
          onPress={onPress}
          isLoading={isLoading}
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
        <Text style={styles.title}>Session Library</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="notifications-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.subHeader}>
        <Text style={styles.subHeaderText}>Your Sessions</Text>
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
