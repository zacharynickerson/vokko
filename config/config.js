import { Platform } from 'react-native';

const DEV_API_URL = Platform.select({
  ios: 'http://localhost:3000',
  android: 'http://10.0.2.2:3000', // This is the default IP for Android emulator
});

const PROD_API_URL = 'vokko-hnev3cfwq-zacharynickersons-projects.vercel.app'; // Replace with your actual production URL

export const API_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;
