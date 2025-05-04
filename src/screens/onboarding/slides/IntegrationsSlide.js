import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

const { width } = Dimensions.get('window');

const IntegrationsSlide = ({ onNext }) => {
  const integrations = [
    {
      name: 'ChatGPT',
      description: 'Refine and expand your ideas',
      icon: require('../../../assets/images/chatgpt-icon.png'),
    },
    {
      name: 'Claude',
      description: 'Get deeper insights from your thoughts',
      icon: require('../../../assets/images/claude-icon.png'),
    },
    {
      name: 'Notion',
      description: 'Store and organize your structured notes',
      icon: require('../../../assets/images/notion-icon.png'),
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Seamlessly Connect</Text>
        
        <View style={styles.integrationsContainer}>
          {integrations.map((integration, index) => (
            <View key={index} style={styles.integrationItem}>
              <Image source={integration.icon} style={styles.integrationIcon} />
              <Text style={styles.integrationName}>{integration.name}</Text>
              <Text style={styles.integrationDescription}>
                {integration.description}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.connectionFlow}>
          <Image
            source={require('../../../assets/images/connection-flow.png')}
            style={styles.connectionFlowImage}
            resizeMode="contain"
          />
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
    color: '#1B1D21',
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
  integrationIcon: {
    width: wp(15),
    height: wp(15),
    marginBottom: hp(1),
  },
  integrationName: {
    fontSize: wp(4),
    fontWeight: 'bold',
    color: '#1B1D21',
    textAlign: 'center',
    marginBottom: hp(1),
  },
  integrationDescription: {
    fontSize: wp(3),
    color: '#666',
    textAlign: 'center',
  },
  connectionFlow: {
    width: '100%',
    height: hp(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionFlowImage: {
    width: '100%',
    height: '100%',
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