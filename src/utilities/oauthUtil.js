// oauthUtil.js
import { AuthSession } from 'expo';

const getClientCredentials = () => {
  // Replace these with your actual client ID
  const clientId = '1095299721221-abkeotujpl43rvihc3vlgsk8r3r59h7h.apps.googleusercontent.com';
  // No need for client secret for iOS client ID
  return { clientId };
};

const getAccessToken = async () => {
  try {
    const { clientId } = getClientCredentials();

    // Replace 'yourapp://' with the custom URL scheme you set up in your Xcode project
    const redirectUri = 'com.anonymous.VokkoApp';
    const authUrl =
      `https://accounts.google.com/o/oauth2/auth` +
      `?client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=https://www.googleapis.com/auth/drive.file`;

    // ... rest of your code
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
};

export { getAccessToken };

