import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolateColor,
  cancelAnimation,
} from 'react-native-reanimated';
import AppLoading from 'expo-app-loading';

const { width } = Dimensions.get('window');
const SIZE = width * 0.6; // Reduced size
const RING_COUNT = 15;

const FlowingRingsAnimation = ({ isRecording, isPaused }) => {
  const rotations = [...Array(RING_COUNT)].map(() => useSharedValue(0));
  const scales = [...Array(RING_COUNT)].map(() => useSharedValue(1));
  const [timer, setTimer] = useState(0);


  useEffect(() => {
    let interval;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setTimer(prevTimer => prevTimer + 1);
      }, 1000);

      rotations.forEach((rotation, index) => {
        rotation.value = withRepeat(
          withTiming(360, { duration: 20000 + index * 1000 }),
          -1,
          false
        );
      });

      scales.forEach((scale, index) => {
        scale.value = withRepeat(
          withSequence(
            withTiming(1.2, { duration: 2000 }),
            withTiming(1, { duration: 2000 })
          ),
          -1,
          true
        );
      });
    } else if (isPaused) {
      clearInterval(interval);
    } else {
      clearInterval(interval);
      setTimer(0);

      rotations.forEach((rotation) => {
        cancelAnimation(rotation);
        rotation.value = withTiming(0, { duration: 300 });
      });

      scales.forEach((scale) => {
        cancelAnimation(scale);
        scale.value = withTiming(1, { duration: 300 });
      });
    }


    return () => {
      clearInterval(interval);
      rotations.forEach((rotation) => cancelAnimation(rotation));
      scales.forEach((scale) => cancelAnimation(scale));
    };
  }, [isRecording, isPaused]);

  const formatTime = (timer) => {
    const minutes = String(Math.floor(timer / 60)).padStart(2, '0');
    const seconds = String(timer % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const createRingStyle = (rotation, scale, index) => {
    return useAnimatedStyle(() => {
      const backgroundColor = interpolateColor(
        rotation.value,
        [0, 120, 240, 360],
        [
          'rgba(255, 255, 255, 0.3)',  // Start with White
          'rgba(255, 105, 180, 0.3)',  // Hot Pink
          'rgba(255, 223, 0, 0.3)',    // Gold
          'rgba(255, 255, 255, 0.3)',  // Back to White
        ]
      );

      return {
        transform: [
          { rotate: `${rotation.value}deg` },
          { scale: scale.value },
        ],
        borderColor: backgroundColor,
        opacity: isRecording ? (RING_COUNT - index) / RING_COUNT : ((RING_COUNT - index) / RING_COUNT) * 0.5,
      };
    });
  };



  return (
    <View style={styles.container}>
      {[...Array(RING_COUNT)].map((_, index) => (
        <Animated.View
          key={index}
          style={[
            styles.ring,
            { width: SIZE - index * 8, height: SIZE - index * 15 }, // Adjusted dimensions
            createRingStyle(rotations[index], scales[index], index),
          ]}
        />
      ))}
      <Text style={styles.timer}>{formatTime(timer)}</Text>
      <View style={styles.glow} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SIZE,
    height: SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    borderRadius: SIZE / 2,
    borderWidth: 4, // Adjusted border width
    borderStyle: 'solid',
  },
  timer: {
    position: 'absolute',
    fontSize: 20,
    color: 'white',
    textShadowColor: 'black',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  glow: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 10,
    shadowColor: 'rgba(255, 255, 255, 0.7)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 10,
    shadowRadius: 50,
  },
});

export default FlowingRingsAnimation;
