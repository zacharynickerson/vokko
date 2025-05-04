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
  const [usageTime, setUsageTime] = useState('');
  const [topics, setTopics] = useState([]);
  const [integrations, setIntegrations] = useState([]);

  const usageTimes = [
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

  const integrationOptions = [
    'ChatGPT',
    'Claude',
    'Notion',
  ];

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

  const handleIntegrationToggle = (integration) => {
    let newIntegrations;
    if (integrations.includes(integration)) {
      newIntegrations = integrations.filter(i => i !== integration);
    } else {
      newIntegrations = [...integrations, integration];
    }
    setIntegrations(newIntegrations);
    updatePreferences({ integrations: newIntegrations });
  };

  const updatePreferences = (newPreferences) => {
    if (onPreferencesChange) {
      onPreferencesChange({
        usageTime,
        topics,
        integrations,
        ...newPreferences
      });
    }
  };

  const handleGetStarted = async () => {
    try {
      // Call onNext to proceed to the next screen
      onNext();
    } catch (error) {
      console.error('Error saving preferences:', error);
      // Still proceed to next screen even if saving preferences fails
      onNext();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Make Ramble Work for You</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              When do you plan to use Ramble the most?
            </Text>
            <View style={styles.optionsContainer}>
              {usageTimes.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.optionButton,
                    usageTime === time && styles.selectedOption,
                  ]}
                  onPress={() => setUsageTime(time)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      usageTime === time && styles.selectedOptionText,
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

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Which tools would you like to integrate with?
            </Text>
            <View style={styles.optionsContainer}>
              {integrationOptions.map((integration) => (
                <TouchableOpacity
                  key={integration}
                  style={[
                    styles.optionButton,
                    integrations.includes(integration) && styles.selectedOption,
                  ]}
                  onPress={() => handleIntegrationToggle(integration)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      integrations.includes(integration) && styles.selectedOptionText,
                    ]}
                  >
                    {integration}
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