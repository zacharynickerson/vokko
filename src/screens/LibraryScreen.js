import { StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ActivityIndicator, Image, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getVoiceNotesFromLocal } from '../utilities/voiceNoteLocalStorage';
import { FlatList } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../../config/firebase';
import { ref, get } from 'firebase/database';


export default function LibraryScreen() {
  const [voiceNotes, setVoiceNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const [userName, setUserName] = useState('');


  // Function to clear AsyncStorage
  const clearAsyncStorage = async () => {
    try {
      await AsyncStorage.clear();
      console.log('AsyncStorage cleared successfully.');
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error);
    }
  };

  // Function to fetch user data
  const fetchUserData = async () => {
    try {
      const userId = auth.currentUser.uid;
      const userRef = ref(db, `/users/${userId}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const userData = snapshot.val();
        const firstName = userData.name.split(' ')[0];  // Extract the first name
        setUserName(firstName);
      } else {
        console.log("No user data available");
      }
    } catch (error) {
      console.error("Error fetching user data: ", error);
    }
  };

  
  useFocusEffect(
    React.useCallback(() => {
      const fetchVoiceNotes = async () => {
        try {
          const notes = await getVoiceNotesFromLocal();
          // Sort the notes by createdDate in descending order
          const sortedNotes = notes.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
          setVoiceNotes(sortedNotes);
        } catch (error) {
          console.error('Failed to load voice notes:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchUserData();  // Fetch user data when the screen is focused
      fetchVoiceNotes();
    }, [])
  );

  // When the notes are loading:
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#191A23" />
      </View>
    );
  }

  return (
    // <View className="flex-1 space-y-4" style={{ backgroundColor: '#191A23' }}>
    //   <SafeAreaView className="flex-1 flex mx-5">
    //     {/* TOP TEXT */}
    //     <TouchableOpacity onPress={clearAsyncStorage}>
    //       <Text style={{ fontSize: wp(3.7) }} className="text-gray-400 font-regular mt-2">
    //       {userName ? `Hello ${userName}` : 'Hello'}
    //       </Text>
    //     </TouchableOpacity>

    //     <View style={{ marginBottom: 10 }}>
    //       <Text className="text-white font-regular mt-2" style={{ fontSize: 18 }}>
    //         Voice Notes
    //       </Text>
    //     </View>

    //     {/* LIBRARY */}
    //     <FlatList
    //       data={voiceNotes.filter(note => note && note.uri)} // Filter out null or invalid items
    //       keyExtractor={(item) => item?.voiceNoteId || ''}

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



