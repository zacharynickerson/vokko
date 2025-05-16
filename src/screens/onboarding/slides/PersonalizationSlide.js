import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../../../config/firebase';
import { ref, set } from 'firebase/database';

const { width } = Dimensions.get('window');

const PersonalizationSlide = ({ onNext, onPreferencesChange }) => {
  const [usageTimes, setUsageTimes] = useState([]);
  const [topics, setTopics] = useState([]);

  const usageTimeOptions = [
    'Morning commute',
    'Midday walk',
    'Meetings',
    'Evening reflection',
    'Other',
  ];

  const topicOptions = [
    'Work',
    'Personal',
    'Ideas',
    'Projects',
    'Goals',
    'Journal',
    'Other',
  ];

  const handleUsageTimeToggle = (time) => {
    let newTimes;
    if (usageTimes.includes(time)) {
      newTimes = usageTimes.filter(t => t !== time);
    } else {
      newTimes = [...usageTimes, time];
    }
    setUsageTimes(newTimes);
    updatePreferences({ usageTimes: newTimes });
  };

  const handleTopicToggle = (topic) => {
    let newTopics;
    if (topics.includes(topic)) {
      newTopics = topics.filter(t => t !== topic);
    } else {
      newTopics = [...topics, topic];
    }
    setTopics(newTopics);
    updatePreferences({ topics: newTopics });
  };

  const updatePreferences = (newPreferences) => {
    if (onPreferencesChange) {
      onPreferencesChange({
        usageTimes,
        topics,
        ...newPreferences
      });
    }
  };

  const handleGetStarted = async () => {
    try {
      onNext();
    } catch (error) {
      console.error('Error saving preferences:', error);
      onNext();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Make Rambull Work for You</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              When do you plan to use Rambull?
            </Text>
            <View style={styles.optionsContainer}>
              {usageTimeOptions.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.optionButton,
                    usageTimes.includes(time) && styles.selectedOption,
                  ]}
                  onPress={() => handleUsageTimeToggle(time)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      usageTimes.includes(time) && styles.selectedOptionText,
                    ]}
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              What topics do you usually talk about?
            </Text>
            <View style={styles.optionsContainer}>
              {topicOptions.map((topic) => (
                <TouchableOpacity
                  key={topic}
                  style={[
                    styles.optionButton,
                    topics.includes(topic) && styles.selectedOption,
                  ]}
                  onPress={() => handleTopicToggle(topic)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      topics.includes(topic) && styles.selectedOptionText,
                    ]}
                  >
                    {topic}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.getStartedButton}
        onPress={handleGetStarted}
      >
        <Text style={styles.getStartedButtonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width,
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: wp(7),
    fontWeight: 'bold',
    color: '#1B1D21',
    textAlign: 'center',
    marginBottom: hp(4),
  },
  section: {
    width: '100%',
    marginBottom: hp(4),
  },
  sectionTitle: {
    fontSize: wp(4.5),
    fontWeight: 'bold',
    color: '#1B1D21',
    marginBottom: hp(2),
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  optionButton: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: hp(1),
    width: '48%',
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#4FBF67',
  },
  optionText: {
    fontSize: wp(3.5),
    color: '#666',
  },
  selectedOptionText: {
    color: 'white',
  },
  getStartedButton: {
    backgroundColor: '#4FBF67',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: hp(2),
  },
  getStartedButtonText: {
    color: 'white',
    fontSize: wp(4.5),
    fontWeight: 'bold',
  },
});

export default PersonalizationSlide; 