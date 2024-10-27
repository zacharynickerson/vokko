const DEV = false;  // Set to false for production

// Development URLs
export const DEV_API_URL = 'ws://localhost:8080';
export const DEV_DEPLOYMENT_URL = 'http://localhost:3000'; // Change this to 3000

// Production URLs
export const PROD_API_URL = 'https://token-server-793156853153.us-central1.run.app';
export const PROD_DEPLOYMENT_URL = 'https://python-backend-793156853153.us-central1.run.app';

// Exported URLs based on environment
export const API_URL = DEV ? DEV_API_URL : PROD_API_URL;
export const DEPLOYMENT_URL = DEV ? DEV_DEPLOYMENT_URL : PROD_DEPLOYMENT_URL;
