import React, { useEffect, useState, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { Audio } from 'expo-av';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { FontAwesome5 } from '@expo/vector-icons';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

const Playback = forwardRef(({ uri }, ref) => {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const progressWidth = useSharedValue(0);
  const scrubberPosition = useSharedValue(0);
  const isSeeking = useRef(false);

  useEffect(() => {
    loadSound();
    return () => unloadSound();
  }, [uri]);

  useImperativeHandle(ref, () => ({
    stopAudio: stopAudio
  }));

  const loadSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { progressUpdateIntervalMillis: 1000 / 60 },
        onPlaybackStatusUpdate
      );
      setSound(sound);
    } catch (error) {
      console.error('Error loading sound:', error);
    }
  };

  const unloadSound = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
    }
  };

  const onPlaybackStatusUpdate = useCallback((status) => {
    if (status.isLoaded) {
      setDuration(status.durationMillis);
      setPosition(status.positionMillis);
      if (!isSeeking.current) {
        const progress = status.positionMillis / status.durationMillis;
        progressWidth.value = withTiming(progress);
        scrubberPosition.value = withTiming(progress * 300); // Assuming 300 is the width of the progress bar
      }
      setIsPlaying(status.isPlaying);
    }
  }, []);

  const togglePlayPause = async () => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    }
  };

  const stopAudio = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.setPositionAsync(0);
      progressWidth.value = 0;
      scrubberPosition.value = 0;
    }
  };

  const seek = async (newPosition) => {
    if (sound) {
      await sound.setPositionAsync(newPosition * duration);
    }
  };

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      isSeeking.current = true;
    })
    .onUpdate((e) => {
      const newProgress = Math.max(0, Math.min(1, e.x / 300));
      progressWidth.value = newProgress;
      scrubberPosition.value = e.x;
    })
    .onEnd((e) => {
      const newProgress = Math.max(0, Math.min(1, e.x / 300));
      runOnJS(seek)(newProgress);
      isSeeking.current = false;
    });

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  const scrubberStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: scrubberPosition.value }],
  }));

  const formatTime = (millis) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={togglePlayPause}>
        <FontAwesome5
          name={isPlaying ? 'pause' : 'play'}
          size={24}
          color={'#888'}
          style={styles.playButton}
        />
      </TouchableOpacity>
      <View style={styles.progressContainer}>
        <GestureDetector gesture={panGesture}>
          <View style={styles.progressBackground}>
            <Animated.View style={[styles.progressForeground, progressStyle]} />
            <Animated.View style={[styles.scrubber, scrubberStyle]} />
          </View>
        </GestureDetector>
      </View>
      <Text style={styles.duration}>
        {formatTime(position)} / {formatTime(duration)}
      </Text>
    </View>
  );
});


const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  playButton: {
    marginRight: 12,
  },
  progressContainer: {
    flex: 1,
    height: 20,
    justifyContent: 'center',
  },
  progressBackground: {
    height: 3,
    backgroundColor: '#888',
    borderRadius: 1.5,
    overflow: 'visible',
  },
  progressForeground: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  scrubber: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
    position: 'absolute',
    top: -3.5,
    left: -5,
  },
  duration: {
    fontSize: wp(3),
    color: '#888',
    marginLeft: 12,
  },
});

export default Playback;