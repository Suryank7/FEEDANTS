/**
 * API Configuration
 * Central configuration for all API calls.
 */

import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api/v1';
  }
  return 'http://localhost:5000/api/v1';
};

const API_BASE_URL = getBaseUrl();

// Alternative URLs for different environments
const API_URLS = {
  androidEmulator: 'http://10.0.2.2:5000/api/v1',
  iosSimulator: 'http://localhost:5000/api/v1',
  web: 'http://localhost:5000/api/v1',
  // Replace with your machine's IP for physical device testing
  physicalDevice: 'http://192.168.1.100:5000/api/v1',
};

export default API_BASE_URL;
export { API_URLS };
