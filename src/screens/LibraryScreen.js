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
    <View className="flex-1 space-y-4" style={{ backgroundColor: '#191A23' }}>
      <SafeAreaView className="flex-1 flex mx-5">
        {/* TOP TEXT */}
        <TouchableOpacity onPress={clearAsyncStorage}>
          <Text style={{ fontSize: wp(3.7) }} className="text-gray-400 font-regular mt-2">
          {userName ? `Hello ${userName}` : 'Hello'}
          </Text>
        </TouchableOpacity>

        <View style={{ marginBottom: 10 }}>
          <Text className="text-white font-regular mt-2" style={{ fontSize: 18 }}>
            Voice Notes
          </Text>
        </View>

        {/* LIBRARY */}
        <FlatList
          data={voiceNotes.filter(note => note && note.uri)} // Filter out null or invalid items
          keyExtractor={(item) => item?.voiceNoteId || ''}
          renderItem={({ item }) => (
            item ? (
              <TouchableOpacity onPress={() => navigation.navigate('VoiceNoteDetails', { voiceNote: item })}>
                <View style={{ marginBottom: 10 }}>
                  <View className="p-4 rounded-xl space-y-2" style={{ backgroundColor: '#242830' }}>
                    <View className="flex-row items-center space-x-1">
                      <Image source={require("../../assets/images/noteicon.png")} style={{ height: hp(3), width: hp(3) }} className="mr-2" />
                      <Text style={{ fontSize: wp(4.3) }} className="font-bold text-white">{item.title}</Text>
                      <View className="flex-row items-center space-x-1"></View>
                    </View>
                    <Text style={{ fontSize: wp(4) }} className="text-gray-400 font-regular">
                      {item.createdDate} - {item.location}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ) : null
          )}
        />
      </SafeAreaView>
    </View>
  );
}



  //Load voice notes from Firebase Realtime Database
    // useEffect(() => {
    //   const loadVoiceNotes = () => {
    //     const voiceNotesRef = ref(db, 'voiceNotes');
    //     onValue(voiceNotesRef, (snapshot) => {
    //       const data = snapshot.val();
    //       if (data) {
    //         const voiceNotesArray = Object.values(data);
    //         setVoiceNotes(voiceNotesArray);
    //       }
    //       setLoading(false);
    //     });
    //   };
    //   loadVoiceNotes();
    // }, []);

