import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { auth, db } from '../../../../config/firebase';
import { ref, update } from 'firebase/database';
import { Linking } from 'react-native';

const { width } = Dimensions.get('window');

const IntegrationsSlide = ({ onNext }) => {
  const [connectedIntegrations, setConnectedIntegrations] = useState([]);

  const integrations = [
    {
      id: 'chatgpt',
      name: 'ChatGPT',
      description: 'Refine ideas in conversation',
      icon: require('/Users/zachary.nickerson/Desktop/vokko/assets/images/chatgpt-logo.png'),
      url: 'https://chat.openai.com/',
    },
    {
      id: 'claude',
      name: 'Claude',
      description: 'Take your ideas deeper',
      icon: require('/Users/zachary.nickerson/Desktop/vokko/assets/images/claude-logo.png'),
      url: 'https://claude.ai/',
    },
    {
      id: 'docs',
      name: 'Google Docs',
      description: 'Continue working on your ideas',
      icon: require('/Users/zachary.nickerson/Desktop/vokko/assets/images/google-docs-logo.png'),
      url: 'https://docs.google.com/',
    },
  ];

  const handleConnect = async (integration) => {
    try {
      // Update Firebase with the connected integration
      const userRef = ref(db, `users/${auth.currentUser.uid}/integrations`);
      const newIntegrations = [...connectedIntegrations, integration.id];
      
      await update(userRef, {
        [integration.id]: {
          connected: true,
          connectedAt: new Date().toISOString(),
        }
      });

      setConnectedIntegrations(newIntegrations);
      
      // Open the integration URL
      Linking.openURL(integration.url);
    } catch (error) {
      console.error('Error connecting integration:', error);
      Alert.alert('Error', 'Failed to connect integration. Please try again.');
    }
  };

  const isConnected = (integrationId) => {
    return connectedIntegrations.includes(integrationId);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Take Your Ideas Further</Text>
        
        <View style={styles.integrationsContainer}>
          {integrations.map((integration, index) => (
            <View key={index} style={styles.integrationItem}>
              <View style={styles.logoContainer}>
                <Image source={integration.icon} style={styles.integrationIcon} />
              </View>
              <Text style={styles.integrationName}>{integration.name}</Text>
              <Text style={styles.integrationDescription}>
                {integration.description}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.nextButton} onPress={onNext}>
        <Text style={styles.nextButtonText}>Next</Text>
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: wp(7),
    fontWeight: 'bold',
    color: '#2C2E33',
    textAlign: 'center',
    marginBottom: hp(4),
  },
  integrationsContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: hp(4),
  },
  integrationItem: {
    alignItems: 'center',
    width: wp(25),
  },
  logoContainer: {
    width: wp(15),
    height: wp(15),
    borderRadius: wp(7.5),
    backgroundColor: '#2C2E33',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(1),
  },
  integrationIcon: {
    width: wp(10),
    height: wp(10),
    resizeMode: 'contain',
  },
  integrationName: {
    fontSize: wp(4),
    fontWeight: 'bold',
    color: '#2C2E33',
    textAlign: 'center',
    marginBottom: hp(1),
  },
  integrationDescription: {
    fontSize: wp(3),
    color: '#2C2E33',
    textAlign: 'center',
    marginBottom: hp(2),
  },
  nextButton: {
    backgroundColor: '#4FBF67',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: hp(2),
  },
  nextButtonText: {
    color: 'white',
    fontSize: wp(4.5),
    fontWeight: 'bold',
  },
});

export default IntegrationsSlide; 