import axios from 'axios';
import { API_CONFIG } from '../config/api.js';

const API_BASE_URL = `${API_CONFIG.BASE_URL}/api`;

// Create axios instance with default config
const locationAPI = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const locationService = {
  // Reverse geocode coordinates to get address
  reverseGeocode: async (latitude, longitude) => {
    try {
      console.log('LocationService: Sending reverse geocode request for:', latitude, longitude);
      const response = await locationAPI.post('/location/reverse-geocode', {
        latitude,
        longitude
      });
      console.log('LocationService: Received reverse geocode response:', response.data);
      return response.data;
    } catch (error) {
      console.error('LocationService: Reverse geocode error:', error);
      // Return a structured error response instead of throwing
      return {
        success: false,
        message: 'Sorry, we could not determine the address for this location. Please try selecting a different location.',
        error: true
      };
    }
  },

  // Geocode address to get coordinates
  geocodeAddress: async (address) => {
    try {
      const response = await locationAPI.get('/location/geocode', {
        params: { address }
      });
      return response.data;
    } catch (error) {
      console.error('Geocode error:', error);
      // Return a structured error response instead of throwing
      return {
        success: false,
        message: 'Sorry, the location could not be found. Please try a different search term or check your spelling.',
        error: true
      };
    }
  },

  // Calculate distance between two points
  calculateDistance: async (lat1, lon1, lat2, lon2) => {
    try {
      const response = await locationAPI.post('/location/distance', null, {
        params: { lat1, lon1, lat2, lon2 }
      });
      return response.data;
    } catch (error) {
      console.error('Distance calculation error:', error);
      throw error;
    }
  }
};

export default locationService;