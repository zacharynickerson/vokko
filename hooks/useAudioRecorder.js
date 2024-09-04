import { useState, useEffect, useCallback } from 'react';
import { Audio } from 'expo-av';

const MAX_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export const useAudioRecorder = () => {
  const [recording, setRecording] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      console.log('Requesting permissions..');
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording..');
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.LOW_QUALITY);
      
      recording.setOnRecordingStatusUpdate(status => {
        setDuration(status.durationMillis);
        if (status.durationMillis >= MAX_DURATION && !status.isDoneRecording) {
          stopRecording();
        }
      });
      
      setRecording(recording);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    console.log('Stopping recording..');
    if (!recording) {
      console.log('No active recording to stop');
      return null;
    }

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setDuration(0);
      console.log('Recording stopped and stored at', uri);
      return uri;
    } catch (error) {
      console.error('Failed to stop recording', error);
    }
  }, [recording]);

  const pauseRecording = useCallback(async () => {
    if (!recording) return;
    console.log('Pausing recording..');
    try {
      await recording.pauseAsync();
      setIsPaused(true);
    } catch (error) {
      console.error('Failed to pause recording', error);
    }
  }, [recording]);

  const resumeRecording = useCallback(async () => {
    if (!recording) return;
    console.log('Resuming recording..');
    try {
      await recording.startAsync();
      setIsPaused(false);
    } catch (error) {
      console.error('Failed to resume recording', error);
    }
  }, [recording]);

  return {
    recording,
    isPaused,
    duration,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording
  };
};