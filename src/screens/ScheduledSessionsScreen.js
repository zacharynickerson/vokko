import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import moment from 'moment';
import { getScheduledSessions, cancelScheduledSession } from '../../config/firebase.js';
import useAuth from '../../hooks/useAuth.js';
import * as Notifications from 'expo-notifications';
import TestSessionButton from '../components/TestSessionButton';

const ScheduledSessionsScreen = ({ navigation }) => {
  const [sessions, setSessions] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    loadSessions();
  }, [user]);

  const loadSessions = async () => {
    if (!user) return;
    const sessionsData = await getScheduledSessions(user.uid);
    if (sessionsData) {
      const sessionsArray = Object.entries(sessionsData).map(([id, data]) => ({
        id,
        ...data,
      }));
      
      // Sort sessions by date
      sessionsArray.sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));
      
      setSessions(sessionsArray);
    }
  };

  const handleCancelSession = (session) => {
    Alert.alert(
      "Confirm Cancellation",
      "Are you sure you want to cancel this session?",
      [
        {
          text: "Cancel",
          style: "cancel" // This will dismiss the alert
        },
        {
          text: "OK",
          onPress: async () => {
            try {
              // Cancel the notification if it exists
              if (session.notificationId) {
                await Notifications.cancelScheduledNotificationAsync(session.notificationId);
              }

              // Cancel the session in Firebase
              await cancelScheduledSession(user.uid, session.id);

              // Remove the session from the local state
              setSessions(prevSessions => prevSessions.filter(s => s.id !== session.id));

            } catch (error) {
              console.error('Error cancelling session:', error);
              Alert.alert('Error', 'Failed to cancel the session. Please try again.');
            }
          }
        }
      ],
      { cancelable: false } // Prevents dismissing the alert by tapping outside
    );
  };

  const renderSessionItem = ({ item }) => {
    const isPast = moment(item.scheduledFor).isBefore(moment());
    const isUpcoming = !isPast;

    return (
      <View style={[styles.sessionItem, isPast && styles.pastSession]}>
        <Image 
          source={{ uri: item.guidePhoto }}
          style={styles.guideImage}
        />
        
        <View style={styles.sessionInfo}>
          <Text style={styles.moduleName}>{item.moduleName}</Text>
          <Text style={styles.guideName}>with {item.guideName}</Text>
          <Text style={styles.sessionTime}>
            {moment(item.scheduledFor).format('MMM D, YYYY [at] h:mm A')}
          </Text>
        </View>

        {isUpcoming && (
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => handleCancelSession(item)}
          >
            <MaterialCommunityIcons name="close" size={24} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Upcoming Rambles</Text>
        <View style={styles.placeholder} />
      </View>

      {sessions.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="calendar-blank" size={50} color="#666" />
          <Text style={styles.emptyStateText}>No scheduled sessions</Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderSessionItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.testButtonContainer}>
        <TestSessionButton />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    padding: wp(2),
  },
  title: {
    fontSize: wp(5),
    fontWeight: 'bold',
  },
  placeholder: {
    width: 24,
  },
  listContainer: {
    padding: wp(5),
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp(4),
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: hp(2),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pastSession: {
    opacity: 0.6,
  },
  guideImage: {
    width: wp(15),
    height: wp(15),
    borderRadius: wp(7.5),
  },
  sessionInfo: {
    flex: 1,
    marginLeft: wp(3),
  },
  moduleName: {
    fontSize: wp(4),
    fontWeight: 'bold',
    marginBottom: hp(0.5),
  },
  guideName: {
    fontSize: wp(3.5),
    color: '#666',
    marginBottom: hp(0.5),
  },
  sessionTime: {
    fontSize: wp(3.5),
    color: '#4CAF50',
  },
  cancelButton: {
    padding: wp(2),
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    marginTop: hp(2),
    fontSize: wp(4),
    color: '#666',
  },
  testButtonContainer: {
    alignItems: 'center',
    marginVertical: hp(2),
  },
});

export default ScheduledSessionsScreen;
