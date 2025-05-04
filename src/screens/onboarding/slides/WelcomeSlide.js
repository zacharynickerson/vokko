import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const WelcomeSlide = ({ onNext }) => {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const pulse = Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.2,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]);

    Animated.loop(pulse).start();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Your Pocket Scribe</Text>
        <Text style={styles.subtitle}>
          Transform spoken thoughts into structured notes
        </Text>
        <Text style={styles.description}>
          Record your thoughts while walking or commuting, and Ramble will organize them for you
        </Text>
        
        <View style={styles.animationContainer}>
          <Animated.View style={[styles.micIcon, { transform: [{ scale: pulseAnim }] }]}>
            <Ionicons name="mic" size={80} color="#4FBF67" />
          </Animated.View>
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
    fontSize: wp(8),
    fontWeight: 'bold',
    color: '#1B1D21',
    textAlign: 'center',
    marginBottom: hp(2),
  },
  subtitle: {
    fontSize: wp(5),
    color: '#1B1D21',
    textAlign: 'center',
    marginBottom: hp(2),
  },
  description: {
    fontSize: wp(4),
    color: '#666',
    textAlign: 'center',
    marginBottom: hp(4),
    paddingHorizontal: wp(5),
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