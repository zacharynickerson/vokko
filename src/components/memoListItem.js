import { AVPlaybackStatus, Audio } from 'expo-av';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { StyleSheet, Text, View } from 'react-native';
import { useCallback, useEffect, useState } from 'react';

import { FontAwesome5 } from '@expo/vector-icons';
import { Sound } from 'expo-av/build/Audio';

const MemoListItem = ({ uri }) => {
  const [sound, setSound] = useState();
  const [status, setStatus] = useState();

  async function loadSound() {
    console.log('Loading Sound');
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { progressUpdateIntervalMillis: 1000 / 60 },
      onPlaybackStatusUpdate
    );
    setSound(sound);
  }

  const onPlaybackStatusUpdate = useCallback(async (newStatus) => {
    setStatus(newStatus);

    if (!newStatus.isLoaded || !sound) {
      return;
    }

    if (newStatus.didJustFinish) {
      sound.setStatusAsync({ positionMillis: 0 });
    }
  }, [sound]);

  useEffect(() => {
    loadSound();
  }, [uri]);

  async function playSound() {
    if (!sound) {
      return;
    }
    if (status?.isLoaded && status.isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.replayAsync();
    }
  }

  useEffect(() => {
    return sound
      ? () => {
          console.log('Unloading Sound');
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const formatMillis = (millis) => {
    const minutes = Math.floor(millis / (1000 * 60));
    const seconds = Math.floor((millis % (1000 * 60)) / 1000);

    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const isPlaying = status?.isLoaded ? status.isPlaying : false;
  const position = status?.isLoaded ? status.positionMillis : 0;
  const duration = status?.isLoaded ? status.durationMillis : 1;
  const progress = position / duration;

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    left: `${progress * 100}%`,
    }));

  return (
    <View style={styles.container}>
      {/* play button */}
      <FontAwesome5
        onPress={playSound}
        name={isPlaying ? 'pause' : 'play'}
        size={20}
        color={'gray'}
      />

      {/* Indicator & Timestamp */}
      <View style={styles.playbackContainer}>
        <View style={styles.playbackBackground} />
        <Animated.View
          style={[styles.playbackIndicator, animatedIndicatorStyle]}
        />
        <Text
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            color: 'gray',
            fontFamily: 'InterSemi',
          }}
        >
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

    //shadow
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 1,
    // },
    // shadowOpacity: 0.22,
    // shadowRadius: 2.22,
    // elevation: 3,
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

export default MemoListItem;