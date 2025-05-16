import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const WelcomeSlide = ({ onNext }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('/Users/zachary.nickerson/Desktop/vokko/assets/images/rambull-logo-black.png')}
          style={styles.logoImage}
        />
        {/* <Text style={[styles.title, { color: '#4FBF67' }]}>Your Pocket Scribe</Text> */}
        <Text style={styles.slogan}>
          Capture your thoughts on the go and let Rambull turn them into organized notes.
        </Text>
        
        <View style={styles.animationContainer}>
          <View style={styles.micIcon}>
            <Image
              source={require('/Users/zachary.nickerson/Desktop/vokko/assets/images/rambull-mascot.png')}
              style={{ width: 260, height: 260, resizeMode: 'contain' }}
            />
          </View>
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
  logoImage: {
    width: 220,
    height: 60,
    resizeMode: 'contain',
    marginBottom: hp(1.5),
    marginTop: hp(2),
    alignSelf: 'center',
  },
  title: {
    fontSize: wp(8),
    fontWeight: 'bold',
    color: '#1B1D21',
    textAlign: 'center',
    marginBottom: hp(2),
  },
  slogan: {
    fontSize: wp(4.5),
    color: '#666',
    textAlign: 'center',
    marginBottom: hp(4),
    paddingHorizontal: wp(5),
    lineHeight: hp(3),
  },
  animationContainer: {
    width: '100%',
    height: hp(30),
    alignItems: 'center',
    justifyContent: 'center',
  },
  micIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(79, 191, 103, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
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

export default WelcomeSlide; 