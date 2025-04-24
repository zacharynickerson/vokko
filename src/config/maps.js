// Map configuration
// Using MapBox static images API

// Static map URL generator
export const getStaticMapUrl = (latitude, longitude, zoom = 14, width = 400, height = 200) => {
  if (!latitude || !longitude) {
    console.log('Missing coordinates:', { latitude, longitude });
    return null;
  }

  try {
    // Using a direct MapBox dark style which works well for black screens
    const url = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${longitude},${latitude},${zoom}/${width}x${height}?access_token=pk.eyJ1IjoiemFjaGFyeW5pY2tlcnNvbiIsImEiOiJjbTl2dGt0MTMwbDBoMmlzNmZ1M21pZXQ2In0.uCe610QViEsYaPqfHDt9Mg`;
    
    console.log('Generated map URL:', url);
    return url;
  } catch (error) {
    console.error('Error generating map URL:', error);
    return null;
  }
}; 