import { AVPlaybackStatus, Audio } from 'expo-av';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import { useCallback, useEffect, useState } from 'react';

import { FontAwesome5 } from '@expo/vector-icons';

const Playback = ({ uri }) => {
  const [sound, setSound] = useState();
  const [status, setStatus] = useState();
  const [duration, setDuration] = useState(1); // Initialize duration to avoid division by zero
  const [position, setPosition] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  useEffect(() => {
    console.log('Received URI:', uri); // Log the URI when it's received
  }, [uri]);

  useEffect(() => {
    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { progressUpdateIntervalMillis: 1000 / 60 },
          onPlaybackStatusUpdate
        );
        // console.log('Sound loaded:', sound); // Log when the sound is loaded
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
    // console.log('Playback status updated:', newStatus); // Log the updated playback status
    setStatus(newStatus);
    if (newStatus.isLoaded) {
      setDuration(newStatus.durationMillis);
      setPosition(newStatus.positionMillis);
    }
  }, []);

  const handleSeek = (value) => {
    console.log('Seeking:', value); // Log when seeking
    if (sound && duration) {
      const newPosition = Math.min(Math.max(value, 0), duration);
      setPosition(newPosition);
      sound.setPositionAsync(newPosition);
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      setIsSeeking(true);
      if (isPlaying) {
        sound.pauseAsync(); // Pause the audio playback when seeking
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
        sound.playAsync(); // Resume the audio playback when seeking ends
      }
    },
  });
  
  const progress = duration ? position / duration : 0;

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    left: `${progress * 100}%`,
  }));

  const formatMillis = (millis) => {
    const minutes = Math.floor(millis / (1000 * 60));
    const seconds = Math.floor((millis % (1000 * 60)) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const isPlaying = status?.isLoaded ? status.isPlaying : false;

  return (
    
    <View style={styles.container}>

      {/* Play Button */}
      <FontAwesome5
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
        color={'gray'}
      />

      
      <View style={styles.playbackContainer} {...panResponder.panHandlers}>
        
          {/* Playback Indicator Line */}
          <View style={styles.playbackBackground} />
        
          {/* Playback Indicator Circle */}
          <Animated.View style={[styles.playbackIndicator, animatedIndicatorStyle]} />

          {/* Duration */}
          <Text style={{ position: 'absolute', right: 0, bottom: 0, color: 'gray', fontFamily: 'InterSemi' }}>
            {formatMillis(position || 0)} / {formatMillis(duration || 0)}
          </Text>
          
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#242830',
    margin: 5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 0,
    borderRadius: 10,
    gap: 15,
  },
  playbackContainer: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
  },
  playbackBackground: {
    height: 3,
    backgroundColor: 'gainsboro',
    borderRadius: 5,
  },
  playbackIndicator: {
    width: 10,
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: 'royalblue',
    position: 'absolute',
  },
});

export default Playback;