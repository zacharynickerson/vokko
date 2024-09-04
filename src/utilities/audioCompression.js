import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';

export const compressAudio = async (uri) => {
  console.log('Compressing audio...');
  const info = await FileSystem.getInfoAsync(uri);
  console.log('Original file size:', info.size);

  // For now, let's return the original URI without compression
  console.log('Audio compression not implemented. Returning original URI.');
  return uri;
}


// export const compressAudio = async (uri) => {
//   console.log('Compressing audio...');
//   const info = await FileSystem.getInfoAsync(uri);
//   console.log('Original file size:', info.size);

//   const compressedUri = `${FileSystem.cacheDirectory}compressed_${Date.now()}.m4a`;
  
//   try {
//     await Audio.createAudioAsync(
//       { uri: compressedUri },
//       { uri },
//       { codec: Audio.ENCODING_AAC_LC, bitRate: 64000, sampleRate: 44100, numberOfChannels: 1 },
//       (status) => console.log('Compression progress:', status.durationMillis)
//     );

//     const compressedInfo = await FileSystem.getInfoAsync(compressedUri);
//     console.log('Compressed file size:', compressedInfo.size);

//     return compressedUri;
//   } catch (error) {
//     console.error('Error compressing audio:', error);
//     return uri; // Return original URI if compression fails
//   }
// };