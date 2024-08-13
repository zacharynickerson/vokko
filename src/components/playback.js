import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View, PanResponder } from 'react-native';
import { Audio } from 'expo-av';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { FontAwesome5 } from '@expo/vector-icons';

const Playback = ({ uri }) => {
  const [sound, setSound] = useState();
  const [status, setStatus] = useState();
  const [duration, setDuration] = useState(1);
  const [position, setPosition] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const progress = useSharedValue(0);

  useEffect(() => {
    console.log('Received URI:', uri);
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

    loadSound();

    return () => {
      if (sound) {
        console.log('Unloading Sound');
        sound.unloadAsync();
      }
    };
  }, [uri]);

  const onPlaybackStatusUpdate = useCallback((newStatus) => {
    setStatus(newStatus);
    if (newStatus.isLoaded) {
      setDuration(newStatus.durationMillis);
      setPosition(newStatus.positionMillis);
      progress.value = newStatus.positionMillis / newStatus.durationMillis;
    }
  }, []);

  const handleSeek = (value) => {
    console.log('Seeking:', value);
    if (sound && duration) {
      const newPosition = Math.min(Math.max(value, 0), duration);
      setPosition(newPosition);
      sound.setPositionAsync(newPosition);
      progress.value = newPosition / duration;
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      setIsSeeking(true);
      if (isPlaying) {
        sound.pauseAsync();
      }
    },
    onPanResponderMove: (_, gestureState) => {
      if (isSeeking) {
        const newValue = (gestureState.moveX / 300) * duration;
        handleSeek(newValue);
      }
    },
    onPanResponderRelease: () => {
      setIsSeeking(false);
      if (isPlaying) {
        sound.playAsync();
      }
    },
  });

  const animatedScrubberStyle = useAnimatedStyle(() => ({
    left: `${progress.value * 100}%`,
  }));

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const formatMillis = (millis) => {
    const minutes = Math.floor(millis / (1000 * 60));
    const seconds = Math.floor((millis % (1000 * 60)) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const isPlaying = status?.isLoaded ? status.isPlaying : false;

  return (
    <View style={styles.container}>
      <FontAwesome5
        style={styles.playButton}
        onPress={async () => {
          try {
            if (sound) {
              if (isPlaying) {
                await sound.pauseAsync();
              } else {
                if (status.positionMillis === status.durationMillis) {
                  await sound.replayAsync();
                } else {
                  await sound.playAsync();
                }
              }
            }
          } catch (error) {
            console.error('Error:', error);
          }
        }}
        name={isPlaying ? 'pause' : 'play'}
        size={20}
        color={'#007AFF'}
      />
      
      <View style={styles.progressContainer} {...panResponder.panHandlers}>
        <View style={styles.progressBackground}>
          <Animated.View style={[styles.progressForeground, animatedProgressStyle]} />
        </View>
        <Animated.View style={[styles.scrubber, animatedScrubberStyle]} />
      </View>
      
      <Text style={styles.duration}>
        {formatMillis(position || 0)} / {formatMillis(duration || 0)}
      </Text>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    // backgroundColor: '#1C1C1E', // Keep the dark background
  },
  playButton: {
    marginRight: 12,
    color: '#FFF'
  },
  progressContainer: {
    flex: 1,
    height: 20,
    justifyContent: 'center',
  },
  progressBackground: {
    height: 4,
    backgroundColor: '#3A3A3C',
    borderRadius: 2,
  },
  progressForeground: {
    height: '100%',
    backgroundColor: '#FFFFFF', // Changed to white
    borderRadius: 2,
  },
  scrubber: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    top: '50%',
    marginTop: -6, // Half the height to center it
  },
  duration: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 12,
  },
});

export default Playback;