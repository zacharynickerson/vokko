import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, cancelAnimation, runOnJS } from 'react-native-reanimated';

const BAR_COUNT = 30;
const CIRCLE_RADIUS = Dimensions.get('window').width * 0.3;
const BAR_WIDTH = 3;
const BAR_MAX_HEIGHT = 50;

const AudioWaveform = ({ isRecording, metering }) => {
  const bars = [...Array(BAR_COUNT)].map(() => useSharedValue(0));

  const animateBar = (index) => {
    'worklet';
    const randomValue = Math.random() * 0.5 + 0.2; // Random value between 0.2 and 0.7
    bars[index].value = withTiming(randomValue, { duration: 500 }, (finished) => {
      if (finished && isRecording) {
        runOnJS(animateBar)(index);
      }
    });
  };

  useEffect(() => {
    if (isRecording) {
      bars.forEach((_, index) => {
        animateBar(index);
      });
    } else {
      bars.forEach(bar => {
        cancelAnimation(bar);
        bar.value = withTiming(0, { duration: 300 });
      });
    }
  }, [isRecording]);

  return (
    <View style={styles.container}>
      {bars.map((bar, index) => {
        const angle = (index / BAR_COUNT) * 2 * Math.PI;
        const translateX = Math.cos(angle) * CIRCLE_RADIUS;
        const translateY = Math.sin(angle) * CIRCLE_RADIUS;
        const rotate = `${angle + Math.PI / 2}rad`;

        return (
          <Animated.View
            key={index}
            style={[
              styles.bar,
              {
                transform: [
                  { translateX },
                  { translateY },
                  { rotate },
                ],
              },
              useAnimatedStyle(() => ({
                height: bar.value * BAR_MAX_HEIGHT + 5,
                opacity: isRecording ? 0.7 : 0.3,
              })),
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CIRCLE_RADIUS * 2,
    height: CIRCLE_RADIUS * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    position: 'absolute',
    width: BAR_WIDTH,
    backgroundColor: '#4CD964', // Siri-like green color
    borderRadius: BAR_WIDTH / 2,
  },
});

export default AudioWaveform;