import * as React from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  ListRenderItem,
  Text,
} from 'react-native';
import { useEffect } from 'react';
import {
  AudioSession,
  LiveKitRoom,
  useTracks,
  TrackReferenceOrPlaceholder,
  VideoTrack,
  isTrackReference,
  registerGlobals,
} from '@livekit/react-native';
import { Track } from 'livekit-client';

registerGlobals();


export default function LiveKit({ wsURL, token }) {
  // Start the audio session first.
  useEffect(() => {
    let start = async () => {
      await AudioSession.startAudioSession();
    };

    start();
    return () => {
      AudioSession.stopAudioSession();
    };
  }, []);

  // if (!wsURL || !token) {
  //   return <Text>Error: Missing LiveKit configuration</Text>;
  // }

  return (
    <LiveKitRoom
      serverUrl={wsURL}
      token={token}
      connect={true}
      options={{
        // Use screen pixel density to handle screens with differing densities.
        adaptiveStream: { pixelDensity: 'screen' },
      }}
      audio={true}
      video={true}
    >
      <RoomView />
    </LiveKitRoom>
  );
};

const RoomView = () => {
  // Get all camera tracks.
  const tracks = useTracks([Track.Source.Camera]);

  const renderTrack = ({item}) => {
    // Render using the VideoTrack component.
    if(isTrackReference(item)) {
      return (<VideoTrack trackRef={item} style={styles.participantView} />)
    } else {
      return (<View style={styles.participantView} />)
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={tracks}
        renderItem={renderTrack}
        keyExtractor={(item) => item.sid}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  participantView: {
    height: 300,
  },
});