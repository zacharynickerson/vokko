import React, { useState, useRef, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { Ionicons } from '@expo/vector-icons';
import { ref, update } from 'firebase/database';
import { db, auth } from '../../../config/firebase';
import { OnboardingContext } from '../../navigation/appNavigation';

// Import slides
import WelcomeSlide from './slides/WelcomeSlide';
import HowItWorksSlide from './slides/HowItWorksSlide';
import IntegrationsSlide from './slides/IntegrationsSlide';
import PermissionsSlide from './slides/PermissionsSlide';
import PersonalizationSlide from './slides/PersonalizationSlide';

const { width } = Dimensions.get('window');

const OnboardingScreen = () => {
  const navigation = useNavigation();
  const { setOnboardingCompleted } = useContext(OnboardingContext);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [preferences, setPreferences] = useState({});
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef(null);

  const slides = [
    { component: WelcomeSlide },
    { component: HowItWorksSlide },
    { component: IntegrationsSlide },
    { component: PermissionsSlide },
    { component: PersonalizationSlide, props: { onPreferencesChange: setPreferences } },
  ];

  const handleNext = async () => {
    if (currentSlide < slides.length - 1) {
      slidesRef.current.scrollToIndex({ index: currentSlide + 1 });
    } else {
      console.log('=== Get Started Pressed ===');
      console.log('Current navigation state:', navigation.getState());
      console.log('Current preferences state:', preferences);
      
      try {
        console.log('Updating user preferences in Firebase...');
        const userRef = ref(db, `users/${auth.currentUser.uid}`);
        const updateData = {
          onboardingCompleted: true,
          onboardingCompletedAt: new Date().toISOString(),
          preferences: preferences // Store preferences in a separate field
        };
        console.log('Update data:', updateData);
        await update(userRef, updateData);
        console.log('User preferences updated successfully');
        
        // Update the onboarding state to trigger navigation
        setOnboardingCompleted(true);
      } catch (error) {
        console.error('Error updating preferences:', error);
        Alert.alert('Error', 'Failed to save preferences. Please try again.');
      }
    }
  };

  const handleSkip = async () => {
    try {
      const userRef = ref(db, `users/${auth.currentUser.uid}`);
      await update(userRef, {
        onboardingCompleted: true,
        onboardingCompletedAt: new Date().toISOString(),
        onboardingSkipped: true
      });
      // Update the onboarding state to trigger navigation
      setOnboardingCompleted(true);
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      Alert.alert('Error', 'Failed to skip onboarding. Please try again.');
    }
  };

  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {slides.map((_, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 20, 8],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  opacity,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#4FBF67', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.2 }}
        style={styles.gradient}
      >
        <Animated.FlatList
          ref={slidesRef}
          data={slides}
          renderItem={({ item }) => (
            <item.component 
              onNext={handleNext} 
              {...(item.props || {})} 
            />
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onMomentumScrollEnd={(ev) => {
            setCurrentSlide(Math.round(ev.nativeEvent.contentOffset.x / width));
          }}
        />

        <View style={styles.footer}>
          {renderDots()}
          {currentSlide >= 3 && (
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gradient: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4FBF67',
    marginHorizontal: 4,
  },
  skipButton: {
    padding: 10,
  },
  skipButtonText: {
    color: '#4FBF67',
    fontSize: wp(4),
    fontWeight: 'bold',
  },
});

export default OnboardingScreen; 