// Using the API key from GoogleService-Info.plist
const GOOGLE_MAPS_API_KEY = 'AIzaSyCIamHe2AVao_SfZPn6qZpn2YuOuk97bHU';

/**
 * Generates a static map URL for Google Maps
 * @param {number} latitude - The latitude coordinate
 * @param {number} longitude - The longitude coordinate
 * @param {number} zoom - The zoom level (default: 15)
 * @param {string} size - The size of the map image (default: '400x200')
 * @returns {string} The static map URL
 */
export const getStaticMapUrl = (latitude, longitude, zoom = 15, size = '400x200') => {
  console.log('getStaticMapUrl called with:', { latitude, longitude, zoom, size });
  console.log('API Key:', GOOGLE_MAPS_API_KEY);
  console.log('API Key length:', GOOGLE_MAPS_API_KEY?.length);
  
  if (!latitude || !longitude) {
    console.log('Missing coordinates');
    return null;
  }

  if (!GOOGLE_MAPS_API_KEY) {
    console.log('Missing API key');
    return null;
  }
  
  const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';
  const params = new URLSearchParams({
    center: `${latitude},${longitude}`,
    zoom: zoom.toString(),
    size: size,
    scale: '2',
    maptype: 'roadmap',
    markers: `color:red%7C${latitude},${longitude}`,
    key: GOOGLE_MAPS_API_KEY
  });

  const url = `${baseUrl}?${params.toString()}`;
  console.log('Generated URL:', url);
  return url;
};

/**
 * Generates a geocoding URL for reverse geocoding
 * @param {number} latitude - The latitude coordinate
 * @param {number} longitude - The longitude coordinate
 * @returns {string} The geocoding API URL
 */
export const getGeocodingUrl = (latitude, longitude) => {
  if (!latitude || !longitude) return null;
  
  const baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
  const params = new URLSearchParams({
    latlng: `${latitude},${longitude}`,
    key: GOOGLE_MAPS_API_KEY
  });

  return `${baseUrl}?${params.toString()}`;
};

/**
 * Extracts address components from geocoding response
 * @param {Object} result - The geocoding result object
 * @returns {Object} Object containing formatted address and place name
 */
export const extractAddressComponents = (result) => {
  if (!result || !result.address_components) {
    return {
      address: 'Unknown location',
      placeName: 'Unknown place'
    };
  }

  const components = result.address_components;
  let streetNumber = '';
  let route = '';
  let locality = '';
  let administrativeArea = '';
  let country = '';

  components.forEach(component => {
    const types = component.types;
    if (types.includes('street_number')) {
      streetNumber = component.long_name;
    } else if (types.includes('route')) {
      route = component.long_name;
    } else if (types.includes('locality')) {
      locality = component.long_name;
    } else if (types.includes('administrative_area_level_1')) {
      administrativeArea = component.short_name;
    } else if (types.includes('country')) {
      country = component.long_name;
    }
  });

  const address = [streetNumber, route, locality, administrativeArea, country]
    .filter(Boolean)
    .join(', ');

  const placeName = locality || route || 'Unknown place';

  return {
    address,
    placeName
  };
}; 