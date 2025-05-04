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

const HowItWorksSlide = ({ onNext }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Best Experience with Headphones</Text>
        <Text style={styles.description}>
          Ramble works best while on the move. Put in your headphones, start walking, and let your thoughts flow naturally. Ramble will handle the organizing and structuring of your ideas.
        </Text>
        
        <View style={styles.imageContainer}>
          <Image
            source={require('../../../assets/images/walking-with-headphones.png')}
            style={styles.image}
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
    marginBottom: hp(2),
  },
  description: {
    fontSize: wp(4),
    color: '#666',
    textAlign: 'center',
    marginBottom: hp(4),
    paddingHorizontal: wp(5),
    lineHeight: hp(3),
  },
  imageContainer: {
    width: '100%',
    height: hp(35),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(2),
  },
  image: {
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

export default HowItWorksSlide; 