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
  // const [hasPermission, setHasPermission] = useState(false);


  const [isAudioEnabled, setIsAudioEnabled] = useState(false);

  useEffect(() => {
    // Request permissions on mount
    async function requestAudioPermissions() {
      const granted = await Audio.requestPermissionsAsync();
      if (granted) {
        // Set audio mode to playsInSilentModeIOS if permissions are granted
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        setIsAudioEnabled(true);
        console.log("Audio On");
      } else {
        console.error("Audio permissions denied");
      }
    }

    requestAudioPermissions();

    // Cleanup function to restore audio mode on unmount
    return () => {
      if (isAudioEnabled) {
        Audio.setAudioModeAsync({ playsInSilentModeIOS: false });
        console.log("Audio Off");
      }
    };
  }, []);




  useEffect(() => {
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
        // Stop playback before unloading
        sound.stopAsync().then(() => {
          console.log('Audio playback stopped');
          sound.unloadAsync();
        });
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
    // console.log('Seeking:', value); // Log when seeking
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
        <View style={styles.playbackBackground} />
        <Animated.View style={[styles.playbackIndicator, animatedIndicatorStyle]} />
        <Text style={{ position: 'absolute', right: 0, bottom: 0, color: 'gray', fontFamily: 'InterSemi' }}>
          {formatMillis(position || 0)} / {formatMillis(duration || 0)}
        </Text>
      </View>
      <View style={styles.noteInfo} />
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
  noteInfo: {
    width: 10,
    aspectRatio: 1,
  },
});

export default Playback;



  // const [permissionResponse, requestPermission] = Audio.usePermissions();

// useEffect(() => {
//   try {
//     console.log("Audio On");
//        Audio.setAudioModeAsync({
//         playsInSilentModeIOS: true,
//       });
//     } catch (err) {
//       console.error(err);
//     }
//   }, []);

  // useEffect(() => {
  //   const requestPermissions = async () => {
  //     const granted = await requestAudioPermissions();
  //     setHasPermission(granted);
  //   };

  //   requestPermissions();

  //   // return () => {
  //   //   // Optional: Cleanup function to potentially revoke permissions on unmount
  //   //   // (This is not strictly necessary for playsInSilentModeIOS on iOS)
  //   // };
  // }, []);

  // useEffect(() => {
  //   if (hasPermission) {
  //     Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
  //     // Your audio playback logic here
  //   }
  // }, [hasPermission]);

  // useEffect(() => {
  //   console.log('Received URI:', uri); // Log the URI when it's received
    
  // }, [uri]);