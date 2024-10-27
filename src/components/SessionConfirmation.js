import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

const SessionConfirmation = ({ scheduledDate, guideName, onAddToCalendar, onGoToHomepage }) => {
  return (
    <SafeAreaView style={styles.container}>
      
      <View style={styles.content}>
        <Image 
          source={require('../../assets/images/session-scheduled.png')} 
          style={styles.confettiImage}
        />
        <Text style={styles.title}>Session Scheduled</Text>
        <Text style={styles.description}>
          Your session has been successfully scheduled. You'll receive a call from <Text style={styles.guideName}>{guideName}</Text> at your scheduled slot.
        </Text>
        <View style={styles.divider} />
        <View style={styles.scheduleInfo}>
          <Text style={styles.scheduleText}>SCHEDULE</Text>
          <Text style={styles.dateText}>{scheduledDate.format('dddd, MMM D, YYYY @ h:mm A')}</Text>
        </View>
        <TouchableOpacity style={styles.calendarButton} onPress={onAddToCalendar}>
          <Text style={styles.calendarButtonText}>ADD TO CALENDAR</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
      </View>
      <TouchableOpacity style={styles.homepageButton} onPress={onGoToHomepage}>
        <Text style={styles.homepageButtonText}>Go to Homepage</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: wp(4),
    backgroundColor: '#1B1D21',
  },
  headerTitle: {
    color: 'white',
    fontSize: wp(4),
    fontFamily: 'DMSans-Bold',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: wp(6),
    paddingTop: hp(8), // Increased top padding to shift content down
    justifyContent: 'center', // Center content vertically
  },
  confettiImage: {
    width: wp(40),
    height: wp(40),
    marginBottom: hp(4),
  },
  title: {
    fontSize: wp(8),
    fontWeight: 'bold',
    color: '#1B1D21',
    marginBottom: hp(2),
  },
  description: {
    fontSize: wp(4),
    fontFamily: 'DMSans',
    color: '#808080',
    textAlign: 'center',
    marginBottom: hp(4),
    paddingHorizontal: wp(6),
  },
  guideName: {
    color: '#4FBF67',
    fontFamily: 'DMSans',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    width: '120%',
    marginVertical: hp(3),
  },
  scheduleInfo: {
    borderRadius: wp(2),
    padding: wp(4),
    alignItems: 'center',
    width: '100%',
  },
  scheduleText: {
    fontSize: wp(3.5),
    fontFamily: 'DMSans-Medium',
    color: '#4CAF50',
    marginBottom: hp(1),
  },
  dateText: {
    fontSize: wp(3.5),
    fontFamily: 'DMSans-Bold',
    color: '#1B1D21',
    fontWeight: 'bold',
  },
  calendarButton: {
    backgroundColor: '#E1F4E5',
    borderRadius: wp(6),
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(6),
    marginTop: hp(1),
  },
  calendarButtonText: {
    color: '#4FBF67',
    fontSize: wp(3.5),
    fontWeight: 'bold',
  },
  homepageButton: {
    backgroundColor: '#4CAF50',
    borderRadius: wp(6),
    paddingVertical: hp(2),
    marginHorizontal: wp(6),
    marginBottom: hp(4),
  },
  homepageButtonText: {
    color: 'white',
    fontSize: wp(4),
    fontFamily: 'DMSans',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default SessionConfirmation;
