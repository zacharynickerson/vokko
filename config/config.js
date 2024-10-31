const DEV = true;  // Keep dev mode for token server

// Development URLs
export const DEV_API_URL = 'http://localhost:3000';  // Local token server
export const DEV_DEPLOYMENT_URL = 'wss://vokko-br0jpzwx.livekit.cloud'; // Use production LiveKit

// Production URLs
export const PROD_API_URL = 'https://token-server-793156853153.us-central1.run.app';
export const PROD_DEPLOYMENT_URL = 'https://python-backend-793156853153.us-central1.run.app';

// Exported URLs based on environment
export const API_URL = DEV ? DEV_API_URL : PROD_API_URL;
export const DEPLOYMENT_URL = DEV ? DEV_DEPLOYMENT_URL : PROD_DEPLOYMENT_URL;

// LiveKit WebSocket URL
export const LIVEKIT_WS_URL = 'wss://vokko-br0jpzwx.livekit.cloud';
