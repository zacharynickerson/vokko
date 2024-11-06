const DEV = false;  // Set to false for production

// Development URLs
export const DEV_API_URL = 'http://localhost:3000';
export const DEV_DEPLOYMENT_URL = 'http://localhost:3000';

// Production URLs
export const PROD_API_URL = 'https://token-server-793156853153.us-central1.run.app';
export const PROD_DEPLOYMENT_URL = 'https://vokko.herokuapp.com';

// Exported URLs based on environment
export const API_URL = DEV ? DEV_API_URL : PROD_API_URL;
export const DEPLOYMENT_URL = DEV ? DEV_DEPLOYMENT_URL : PROD_DEPLOYMENT_URL;

// LiveKit WebSocket URL
export const LIVEKIT_WS_URL = 'wss://vokko-br0jpzwx.livekit.cloud';
