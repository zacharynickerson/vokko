import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ScrollView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import CustomDatePicker from '../components/CustomDatePicker';
import SessionConfirmation from '../components/SessionConfirmation';
import moment from 'moment';

const SoloSessionSetup = () => {
  const [startOption, setStartOption] = useState('now');
  const [scheduledDate, setScheduledDate] = useState(null);
  const [isSessionScheduled, setIsSessionScheduled] = useState(false);
  const navigation = useNavigation();

  const navigateToSettings = () => {
    navigation.navigate('SettingsScreen');
  };

  const renderHeader = useCallback(() => (
    <View style={styles.headerContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Session Setup</Text>
        <TouchableOpacity onPress={navigateToSettings}>
          <Ionicons name="notifications-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  ), [navigation]);

  const handleStartSession = () => {
    navigation.navigate('CallStack', {
      screen: 'SoloSessionCall'
    });
  };

  const handleScheduleSession = () => {
    // Here you would typically call your API to set up the scheduled session
    setIsSessionScheduled(true);
  };

  const handleAddToCalendar = () => {
    // Implement the logic to add the session to the user's calendar
    console.log('Adding to calendar');
  };

  const handleGoToHomepage = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'HomeScreen' }],
    });
  };

  if (isSessionScheduled) {
    return (
      <SessionConfirmation
        scheduledDate={moment(scheduledDate)}
        onAddToCalendar={handleAddToCalendar}
        onGoToHomepage={handleGoToHomepage}
        navigation={navigation}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.stepContentWrapper}>
          <Text style={styles.stepTitle}>Session Start</Text>
          <View style={styles.chooseTimeContainer}>
            <MaterialCommunityIcons name="clock-outline" size={24} color="#4CAF50" />
            <Text style={styles.subtitle}>Choose when</Text>
          </View>
          <View style={styles.startOptionsContainer}>
            <TouchableOpacity
              style={[styles.startOption, startOption === 'now' && styles.selectedStartOption]}
              onPress={() => setStartOption('now')}
            >
              <MaterialCommunityIcons
                name={startOption === 'now' ? "circle-slice-8" : "circle-outline"}
                size={24}
                color={startOption === 'now' ? "#4CAF50" : "#1B1D21"}
              />
              <Text style={styles.startOptionText}>Start now</Text>
            </TouchableOpacity>
            <View style={styles.optionDivider} />
            <TouchableOpacity
              style={[styles.startOption, startOption === 'schedule' && styles.selectedStartOption]}
              onPress={() => setStartOption('schedule')}
            >
              <MaterialCommunityIcons
                name={startOption === 'schedule' ? "circle-slice-8" : "circle-outline"}
                size={24}
                color={startOption === 'schedule' ? "#4CAF50" : "#1B1D21"}
              />
              <Text style={styles.startOptionText}>Schedule a time</Text>
            </TouchableOpacity>
          </View>
          {startOption === 'schedule' && (
            <View style={styles.datePickerWrapper}>
              <CustomDatePicker
                onDateSelect={(date, time) => {
                  setScheduledDate(moment(`${date} ${time}`, 'YYYY-MM-DD HH:mm A').toDate());
                }}
              />
            </View>
          )}
        </View>
      </ScrollView>
      <View style={styles.buttonContainer}>
        {startOption === 'now' ? (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#1B1D21' }]}
            onPress={handleStartSession}
          >
            <View style={styles.buttonContent}>
              <MaterialCommunityIcons
                name="phone"
                size={24}
                color="white"
                style={styles.buttonIcon}
              />
              <Text style={styles.buttonText}>Begin Session</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: '#1B1D21' },
              !scheduledDate && styles.disabledButton
            ]}
            onPress={handleScheduleSession}
            disabled={!scheduledDate}
          >
            <View style={styles.buttonContent}>
              <MaterialCommunityIcons
                name="calendar"
                size={24}
                color={scheduledDate ? "white" : "rgba(255, 255, 255, 0.5)"}
                style={styles.buttonIcon}
              />
              <Text style={[
                styles.buttonText,
                !scheduledDate && styles.disabledButtonText
              ]}>
                Schedule Session
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 70 : 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
    backgroundColor: '#1B1D21',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  stepContentWrapper: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 70 : 80,
  },
  stepTitle: {
    fontSize: wp(7),
    fontWeight: 'bold',
    color: '#1B1D21',
    marginBottom: hp(4),
  },
  chooseTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  subtitle: {
    fontSize: wp(4),
    color: '#1B1D21',
    marginLeft: wp(2),
  },
  startOptionsContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    overflow: 'hidden',
  },
  startOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(3),
    paddingHorizontal: wp(4),
  },
  selectedStartOption: {
    backgroundColor: 'white',
  },
  startOptionText: {
    marginLeft: wp(2),
    fontSize: wp(4),
    color: '#1B1D21',
  },
  optionDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    width: '100%',
  },
  datePickerWrapper: {
    marginTop: hp(2),
  },
  buttonContainer: {
    padding: 20,
    backgroundColor: 'white',
  },
  button: {
    paddingVertical: hp(2),
    borderRadius: 25,
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: wp(4),
    fontWeight: 'bold',
    marginLeft: wp(2),
  },
  buttonIcon: {
    marginRight: wp(2),
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
});

export default SoloSessionSetup;
