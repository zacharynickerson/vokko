import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { PermissionsAndroid, Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { Buffer } from 'buffer';

class AudioManager {
  constructor() {
    this.audioRecorderPlayer = new AudioRecorderPlayer();
    this.recording = false;
    this.playing = false;
  }

  async requestPermissions() {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      ]);
      return (
        granted['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED
      );
    }
    return true;
  }

  async startRecording() {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      console.log('Microphone permission denied');
      return null;
    }

    const path = Platform.select({
      ios: 'audio.m4a',
      android: `${RNFS.DocumentDirectoryPath}/audio.mp4`,
    });

    try {
      const result = await this.audioRecorderPlayer.startRecorder(path);
      this.audioRecorderPlayer.addRecordBackListener((e) => {
        console.log('Recording...', e.current_position);
        return;
      });
      this.recording = true;
      console.log('Recording started at:', path);
      return path;
    } catch (error) {
      console.error('Failed to start recording:', error);
      return null;
    }
  }

  async stopRecording() {
    try {
      const result = await this.audioRecorderPlayer.stopRecorder();
      this.audioRecorderPlayer.removeRecordBackListener();
      this.recording = false;
      console.log('Recording stopped:', result);
      return result;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      return null;
    }
  }

  async startPlaying(path) {
    try {
      console.log('Playing audio:', path);
      this.playing = true;
      await this.audioRecorderPlayer.startPlayer(path);
      this.audioRecorderPlayer.addPlayBackListener((e) => {
        if (e.current_position === e.duration) {
          this.audioRecorderPlayer.stopPlayer();
          this.audioRecorderPlayer.removePlayBackListener();
          this.playing = false;
        }
        return;
      });
    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  }

  async stopPlaying() {
    try {
      await this.audioRecorderPlayer.stopPlayer();
      this.audioRecorderPlayer.removePlayBackListener();
      this.playing = false;
      console.log('Playback stopped');
    } catch (error) {
      console.error('Failed to stop playback:', error);
    }
  }

  async playAIResponse(base64Audio) {
    try {
      const audioData = Buffer.from(base64Audio, 'base64');
      const path = `${RNFS.DocumentDirectoryPath}/ai_response.mp4`;

      // Write binary data to file
      await RNFS.writeFile(path, audioData.toString('base64'), 'base64');
      console.log('AI response audio written to:', path);

      // Play the AI response
      await this.startPlaying(path);
    } catch (error) {
      console.error('Failed to play AI response:', error);
    }
  }
}

export default new AudioManager();
