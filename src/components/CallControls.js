import React, { useState, useEffect, useCallback } from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useLocalParticipant, useRoom } from '@livekit/react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

const CallControls = ({ onCancel }) => {
  const room = useRoom();
  const { localParticipant } = useLocalParticipant();
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(true);

  useEffect(() => {
    if (localParticipant) {
      console.log("Local participant available");
      localParticipant.setMicrophoneEnabled(true);
      setIsMicrophoneEnabled(true);
    }
  }, [localParticipant]);

  const toggleMicrophone = useCallback(() => {
    if (localParticipant) {
      const newState = !isMicrophoneEnabled;
      localParticipant.setMicrophoneEnabled(newState);
      setIsMicrophoneEnabled(newState);
      console.log("Microphone toggled:", newState);
    }
  }, [localParticipant, isMicrophoneEnabled]);

  const handleEndCall = useCallback(() => {
    if (room) {
      room.disconnect();
    }
    onCancel();
  }, [room, onCancel]);

  return (
    <View style={styles.controlsContainer}>
      <TouchableOpacity
        style={styles.controlButton}
        onPress={toggleMicrophone}
      >
        <Icon name={isMicrophoneEnabled ? "mic" : "mic-off"} size={30} color="white" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={handleEndCall}
      >
        <Icon name="close" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  controlsContainer: {
    position: 'absolute',
    bottom: hp(10),
    left: 0,
    right: 0,
    paddingBottom: hp(5),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    width: wp(15),
    height: wp(15),
    borderRadius: wp(7.5),
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(4),
  },
  cancelButton: {
    width: wp(15),
    height: wp(15),
    borderRadius: wp(7.5),
    backgroundColor: '#9D3033',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CallControls;
