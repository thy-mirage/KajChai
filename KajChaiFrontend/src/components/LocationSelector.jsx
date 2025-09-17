import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import locationService from '../services/locationService';
import 'leaflet/dist/leaflet.css';
import './LocationSelector.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationSelector = ({ 
  onLocationSelect, 
  initialLocation = null, 
  showCurrentLocationButton = true,
  isEditMode = false  // New prop to distinguish edit mode
}) => {
  const { t } = useTranslation();
  
  // Safely initialize position with default Dhaka coordinates
  const getInitialPosition = () => {
    if (initialLocation && 
        initialLocation.latitude && 
        initialLocation.longitude &&
        typeof initialLocation.latitude === 'number' &&
        typeof initialLocation.longitude === 'number') {
      return [initialLocation.latitude, initialLocation.longitude];
    }
    return [23.8103, 90.4125]; // Default to Dhaka
  };

  const [position, setPosition] = useState(getInitialPosition());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [addressInfo, setAddressInfo] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false); // Prevent infinite loops
  const mapRef = useRef();

  // Component to handle map clicks
  function LocationMarker() {
    useMapEvents({
      click(e) {
        const newPosition = [e.latlng.lat, e.latlng.lng];
        setPosition(newPosition);
        handleLocationChange(e.latlng.lat, e.latlng.lng);
      },
    });

    return (position && position.length === 2 && position[0] && position[1]) ? 
      <Marker position={position}></Marker> : null;
  }

  const handleLocationChange = async (lat, lng) => {
    if (isUpdating) return; // Prevent infinite loops
    
    try {
      setIsUpdating(true);
      setLoading(true);
      setError('');
      
      console.log('LocationSelector: Requesting location for coordinates:', lat, lng);
      
      // Call reverse geocoding API using service
      const data = await locationService.reverseGeocode(lat, lng);
      
      console.log('LocationSelector: Received location data:', data);
      
      if (data.success) {
        console.log('LocationSelector: Setting address info:', data.data);
        setAddressInfo(data.data);
        if (onLocationSelect) {
          console.log('LocationSelector: Calling onLocationSelect with:', data.data);
          onLocationSelect(data.data);
        }
      } else {
        // Handle graceful error response from service
        console.error('LocationSelector: Location service error:', data.message);
        setError(data.message || t('location.couldNotDetermineAddress'));
      }
    } catch (err) {
      console.error('LocationSelector: Unexpected error:', err);
      setError(t('location.unexpectedError'));
    } finally {
      setLoading(false);
      setIsUpdating(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError(t('location.geolocationNotSupported'));
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const newPosition = [lat, lng];
        
        setPosition(newPosition);
        handleLocationChange(lat, lng);
        
        // Center map on new position
        if (mapRef.current) {
          mapRef.current.setView(newPosition, 15);
        }
      },
      (error) => {
        setError(t('location.errorGettingLocation') + ': ' + error.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError('');

      const data = await locationService.geocodeAddress(searchQuery);

      if (data.success) {
        const lat = data.data.latitude;
        const lng = data.data.longitude;
        const newPosition = [lat, lng];
        
        setPosition(newPosition);
        handleLocationChange(lat, lng);
        
        // Center map on searched location
        if (mapRef.current) {
          mapRef.current.setView(newPosition, 15);
        }
      } else {
        // Handle graceful error response from service
        setError(data.message || t('location.locationNotFound'));
      }
    } catch (err) {
      setError(t('location.searchError'));
    } finally {
      setLoading(false);
    }
  };

  // Initialize with provided location
  useEffect(() => {
    if (initialLocation && 
        initialLocation.latitude && 
        initialLocation.longitude &&
        typeof initialLocation.latitude === 'number' &&
        typeof initialLocation.longitude === 'number') {
      const newPosition = [initialLocation.latitude, initialLocation.longitude];
      setPosition(newPosition);
      
      // In edit mode, pre-populate address info without API call to prevent loops
      // BUT only if we have valid initial location data
      if (isEditMode && initialLocation.city && initialLocation.city !== '') {
        console.log('LocationSelector: Pre-populating with initial location:', initialLocation);
        setAddressInfo({
          city: initialLocation.city || '',
          upazila: initialLocation.upazila || '',
          district: initialLocation.district || '',
          fullAddress: [initialLocation.city, initialLocation.upazila, initialLocation.district].filter(Boolean).join(', '),
          latitude: initialLocation.latitude,
          longitude: initialLocation.longitude
        });
      } else {
        // Always call API if we don't have proper initial data or if in registration mode
        console.log('LocationSelector: Calling API for initial location');
        handleLocationChange(initialLocation.latitude, initialLocation.longitude);
      }
    }
  }, [initialLocation?.latitude, initialLocation?.longitude, isEditMode]); // More specific dependencies

  return (
    <div className="location-selector">
      <div className="location-controls">
        <div className="search-section">
          <div className="search-input-group">
            <input
              type="text"
              placeholder={t('location.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
              className="location-search"
            />
            <button 
              onClick={searchLocation}
              disabled={(loading || isUpdating) || !searchQuery.trim()}
              className="search-btn"
            >
              🔍
            </button>
          </div>
        </div>

        {showCurrentLocationButton && (
          <button 
            onClick={getCurrentLocation}
            disabled={loading || isUpdating}
            className="current-location-btn"
          >
            📍 {t('location.useCurrentLocation')}
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="map-container">
        <MapContainer
          center={position && position.length === 2 && position[0] && position[1] ? position : [23.8103, 90.4125]}
          zoom={13}
          style={{ height: '400px', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker />
        </MapContainer>
      </div>

      {(loading || isUpdating) && (
        <div className="loading-message">
          {t('location.gettingLocationInfo')}
        </div>
      )}

      {addressInfo && (
        <div className="address-info" key={`${addressInfo.latitude}-${addressInfo.longitude}`}>
          <h4>{t('location.selectedLocation')}:</h4>
          <div className="address-details">
            <p><strong>{t('location.city')}:</strong> {addressInfo.city}</p>
            <p><strong>{t('location.area')}:</strong> {addressInfo.upazila}</p>
            <p><strong>{t('location.district')}:</strong> {addressInfo.district}</p>
            <p><strong>{t('location.fullAddress')}:</strong> {addressInfo.fullAddress}</p>
            <p><strong>{t('location.coordinates')}:</strong> {addressInfo.latitude?.toFixed(6)}, {addressInfo.longitude?.toFixed(6)}</p>
          </div>
        </div>
      )}

      <div className="instructions">
        <p>📍 {t('location.clickMapInstruction')}</p>
        <p>🔍 {t('location.searchInstruction')}</p>
        <p>📱 {t('location.currentLocationInstruction')}</p>
      </div>
    </div>
  );
};

export default LocationSelector;