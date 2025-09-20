// Nominatim API service
export async function getLatLonFromLocation(location: string): Promise<{ lat: number; lon: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`;
  console.log('🗺️ Nominatim: Fetching coordinates for location:', location);
  console.log('🗺️ Nominatim: Request URL:', url);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'sampr-crop-app/1.0 (your-email@example.com)'
      }
    });
    
    console.log('🗺️ Nominatim: Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      console.error('🗺️ Nominatim: Request failed with status:', response.status);
      throw new Error(`Nominatim API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('🗺️ Nominatim: Raw response data:', data);
    
    if (data && data.length > 0) {
      const result = {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      };
      console.log('🗺️ Nominatim: Successfully parsed coordinates:', result);
      return result;
    } else {
      console.warn('🗺️ Nominatim: No results found for location:', location);
    }
  } catch (error) {
    console.error('🗺️ Nominatim: Error occurred:', error);
    throw error;
  }
  
  return null;
}

/**
 * Fetch location suggestions from Nominatim API for autocomplete
 * @param query Search query entered by user
 * @returns Array of location suggestions
 */
export async function fetchLocationSuggestions(query: string): Promise<any[]> {
  console.log('🔍 Nominatim: Fetching location suggestions for query:', query);
  
  if (query.length < 3) {
    console.log('🔍 Nominatim: Query too short, returning empty results');
    return [];
  }
  
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
  console.log('🔍 Nominatim: Suggestions request URL:', url);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'sampr-crop-app/1.0 (your-email@example.com)'
      }
    });
    
    console.log('🔍 Nominatim: Suggestions response status:', response.status, response.statusText);
    
    if (!response.ok) {
      console.error('🔍 Nominatim: Suggestions request failed with status:', response.status);
      throw new Error(`Nominatim suggestions request failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('🔍 Nominatim: Suggestions raw response:', data);
    console.log('🔍 Nominatim: Number of suggestions found:', data.length);
    
    return data;
  } catch (error) {
    console.error('🔍 Nominatim: Error fetching suggestions:', error);
    throw error;
  }
}
