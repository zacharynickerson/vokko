import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAnimatedStyle } from 'react-native-reanimated';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

export const RecordingControls = ({ 
  recording, 
  isPaused, 
  onStartRecording, 
  onStopRecording, 
  onPauseRecording, 
  onResumeRecording, 
  onCancelRecording,
  buttonOpacity,
  buttonScale
}) => {
  const animatedButtonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <View style={styles.container}>
      {recording && (
        <Pressable style={styles.controlButton} onPress={onCancelRecording}>
          <Icon name="close" size={30} color="white" />
        </Pressable>
      )}
      <View style={styles.mainButtonContainer}>
        <Pressable
          style={styles.recordButton}
          onPress={recording ? (isPaused ? onResumeRecording : onPauseRecording) : onStartRecording}
        >
          {recording ? (
            isPaused ? (
              <Icon name="play" size={30} color="white" />
            ) : (
              <Icon name="pause" size={30} color="white" />
            )
          ) : (
            <Icon name="mic" size={30} color="white" />
          )}
        </Pressable>
      </View>
      {recording && (
        <Pressable style={styles.controlButton} onPress={onStopRecording}>
          <Icon name="checkmark" size={30} color="white" />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: wp(5),
    paddingHorizontal: wp(5),
  },
  mainButtonContainer: {
    flex: 1,
    alignItems: 'center',
  },
  recordButton: {
    width: 60,
    height: 60,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: 'gray',
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'gray',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: wp(2),
  },
});