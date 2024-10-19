import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, SafeAreaView, Text, TouchableOpacity, View, Alert } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { FlatList } from 'react-native-gesture-handler';
import { auth, db } from '../../config/firebase';
import { ref, onValue, off } from 'firebase/database';
// import { getVoiceNotesFromLocal, saveVoiceNotesToLocal } from '../utilities/voiceNoteLocalStorage'; // Commented out
import { formatDateForDisplay } from '../utilities/helpers';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import SoloVoiceNoteItem from '../components/SoloSessionItem';
import GuidedSessionItem from '../components/GuidedSessionItem'; // Import the GuidedSessionItem

export default function LibraryScreen() {
  const [voiceNotes, setVoiceNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const route = useRoute();

  const navigateToSettings = () => {
    navigation.navigate('SettingsScreen');
  };

  const fetchVoiceNotes = useCallback(async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      setLoading(false);
      return;
    }

    const voiceNotesRef = ref(db, `/voiceNotes/${userId}`);

    const onDataChange = async (snapshot) => {
      try {
        setLoading(true);
        let firebaseNotes = [];
        if (snapshot.exists()) {
          firebaseNotes = Object.values(snapshot.val()).map(note => ({
            voiceNoteId: note.voiceNoteId || note.id, // Use voiceNoteId or fallback to id
            createdDate: note.createdDate || new Date().toISOString(), // Access createdDate
            title: note.title || 'Untitled Note', // Access title
          }));
        }

        const sortedNotes = sortNotesChronologically(firebaseNotes);
        setVoiceNotes(sortedNotes);
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

    return () => off(voiceNotesRef);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (route.params?.refresh) {
        fetchVoiceNotes();
        navigation.setParams({ refresh: undefined });
      }
    }, [route.params?.refresh, fetchVoiceNotes, navigation])
  );

  useEffect(() => {
    fetchVoiceNotes();
  }, [fetchVoiceNotes]);

  const sortNotesChronologically = (notes) => {
    return notes.sort((b, a) => new Date(a.createdDate) - new Date(b.createdDate));
  };

  const renderVoiceNoteItem = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate('VoiceNoteDetails', { voiceNote: item })}>
      <SoloVoiceNoteItem item={item} />
    </TouchableOpacity>
  );

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

      <FlatList
        data={voiceNotes}
        keyExtractor={(item) => item.voiceNoteId}
        renderItem={renderVoiceNoteItem}
        contentContainerStyle={styles.listContent}
        style={styles.flatList}
      />
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
  },
  flatList: {
    backgroundColor: '#F9F9F9',
  },
  itemContainer: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  itemTitle: {
    fontSize: wp(4),
    fontWeight: '500',
  },
});
