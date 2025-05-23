import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, SafeAreaView, Text, TouchableOpacity, View, ScrollView, FlatList, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import SoloVoiceNoteItem from '../components/SoloSessionItem';
import { auth, db, updateVoiceNote } from '../../config/firebase';
import { ref, onValue, off } from 'firebase/database';
import { remove } from 'firebase/database';
import { storage } from '../../config/firebase';
import { deleteObject } from 'firebase/storage';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [recentSession, setRecentSession] = useState(null);
  const [scheduledSessionsCount, setScheduledSessionsCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const navigateToSettings = () => {
    navigation.navigate('RamblingsScreen');
  };

  const navigateToGuidedSessions = () => {
    navigation.navigate('GuidedSessionsScreen');
  };

  const navigateToSoloSession = () => {
    navigation.navigate('CallStack', {
      screen: 'SoloSessionCall'
    });
  };

  const navigateToScheduledSessions = () => {
    navigation.navigate('ScheduledSessions');
  };

  const fetchRecentSession = useCallback(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const voiceNotesRef = ref(db, `/voiceNotes/${userId}`);

    const fetchSessions = (snapshot) => {
      if (snapshot.exists()) {
        return Object.entries(snapshot.val()).map(([id, session]) => ({
          ...session,
          id,
          voiceNoteId: session.voiceNoteId || id,
          isGuided: false
        }));
      }
      return [];
    };

    onValue(voiceNotesRef, (snapshot) => {
      const soloSessions = fetchSessions(snapshot);
      const sortedSessions = soloSessions.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
      
      if (sortedSessions.length > 0) {
        setRecentSession(sortedSessions[0]);
      }
    });

    return () => {
      off(voiceNotesRef);
    };
  }, []);

  useEffect(() => {
    fetchRecentSession();
  }, [fetchRecentSession]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const sessionsRef = ref(db, `scheduledSessions/${auth.currentUser.uid}`);
    const unsubscribe = onValue(sessionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const sessions = Object.values(snapshot.val());
        const futureSessionsCount = sessions.filter(session => 
          session.status === 'scheduled' && 
          new Date(session.scheduledFor) > new Date()
        ).length;
        setScheduledSessionsCount(futureSessionsCount);
      } else {
        setScheduledSessionsCount(0);
      }
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  const extractVoiceNoteIdFromUri = (uri) => {
    if (!uri) return null;
    const parts = uri.split('/');
    const filename = parts.pop();
    return filename ? filename.split('.')[0] : null;
  };

  const sortNotesChronologically = (notes) => {
    return notes.sort((b, a) => {
      const dateA = a.dateCreated || a.createdDate && new Date(a.createdDate).getTime();
      const dateB = b.dateCreated || b.createdDate && new Date(b.createdDate).getTime();
      return dateA - dateB;
    });
  };

  const renderSessionTypeButton = (title, iconName, color, onPress, badgeCount = null) => (
    <TouchableOpacity style={styles.sessionTypeButton} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <MaterialCommunityIcons name={iconName} size={24} color="white" />
        {badgeCount !== null && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeCount}</Text>
          </View>
        )}
      </View>
      <Text style={styles.sessionTypeText}>{title}</Text>
    </TouchableOpacity>
  );

  const handleRetry = async (voiceNoteId) => {
    setIsRetrying(true);
    console.log(`Retrying transcription for voice note ID: ${voiceNoteId}`);

    try {
      await updateVoiceNote(auth.currentUser.uid, voiceNoteId, { status: 'processing' });
      Alert.alert('Retry initiated', 'The transcription process has been retried.');
    } catch (error) {
      console.error('Error retrying transcription:', error);
      Alert.alert('Error', 'Failed to retry transcription.');
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
              setRecentSession(null);
            } catch (error) {
              console.error('Error deleting voice note:', error);
              Alert.alert('Error', 'Failed to delete recording. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handlePress = () => {
    if (recentSession.status === 'completed' || recentSession.status === 'error') {
      console.log('Navigating with recentSession:', recentSession);
      navigation.navigate('VoiceNoteDetails', { voiceNote: recentSession });
    }
  };

  const renderRecentSessionItem = () => {
    if (!recentSession) return null;

    const isLoading = recentSession.status === 'recording' || recentSession.status === 'processing';

    return (
      <View style={styles.recentSessionContainer}>
        <SoloVoiceNoteItem
          item={recentSession}
          onPress={() => navigation.navigate('VoiceNoteDetails', { voiceNote: recentSession })}
          onRetry={() => handleRetry(recentSession.voiceNoteId || recentSession.id)}
          onDelete={() => handleDelete(recentSession.voiceNoteId || recentSession.id)}
          isLoading={isLoading || isRetrying}
          enableMapClick={false}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIcon} onPress={navigateToSettings}>
          <MaterialCommunityIcons name="view-grid" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Rambull</Text>
        <TouchableOpacity style={styles.headerIcon} onPress={navigateToGuidedSessions}>
          <Ionicons name="notifications-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome 👋</Text>
          <Text style={styles.welcomeSubtitle}>Need to talk through an idea?</Text>
        </View>

        <View style={styles.buttonCardsContainer}>
          {renderSessionTypeButton("Start Rambling", "microphone", "#71D7F4", navigateToSoloSession)}
          {renderSessionTypeButton(
            "Upcoming Rambles",
            "calendar-clock",
            "#BA59FE",
            navigateToScheduledSessions,
            scheduledSessionsCount > 0 ? scheduledSessionsCount : null
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Ramblings</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Library', { screen: 'LibraryScreen' })}>
            <Text style={styles.seeAllButton}>See All</Text>
          </TouchableOpacity>
        </View>

        {renderRecentSessionItem()}
      </ScrollView>
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
  welcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  welcomeTitle: {
    fontSize: wp(7),
    fontWeight: 'bold',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: wp(4),
    color: '#666',
  },
  buttonCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sessionTypeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    width: wp(28),
    height: hp(15),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  sessionTypeText: {
    fontSize: wp(3.5),
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1B1D21',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: wp(5),
    fontWeight: 'bold',
  },
  seeAllButton: {
    fontSize: wp(3.5),
    color: '#4FBF67',
  },
  recentSessionContainer: {
    paddingHorizontal: 20,
    width: '100%',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  badgeText: {
    color: 'white',
    fontSize: wp(3),
    fontWeight: 'bold',
  },
});
