import React, { useState } from 'react';
import { fetchLocationSuggestions } from '../services/nominatim';

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationInputProps {
  onLocationSelected: (location: { name: string; lat: number; lon: number }) => void;
}


export const LocationInput: React.FC<LocationInputProps> = ({ onLocationSelected }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugMode, setDebugMode] = useState(false);
  const [customLat, setCustomLat] = useState('');
  const [customLon, setCustomLon] = useState('');

  const fetchSuggestions = async (value: string) => {
    console.log('🔍 LocationInput: Starting to fetch suggestions for:', value);
    setLoading(true);
    setError('');
    try {
      const data = await fetchLocationSuggestions(value);
      console.log('🔍 LocationInput: Received suggestions:', data);
      setSuggestions(data);
    } catch (e) {
      console.error('🔍 LocationInput: Error fetching suggestions:', e);
      setError('Failed to fetch location suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('⌨️ LocationInput: Input changed to:', value);
    setQuery(value);
    if (value.length > 2) {
      console.log('⌨️ LocationInput: Query length sufficient, fetching suggestions');
      fetchSuggestions(value);
    } else {
      console.log('⌨️ LocationInput: Query too short, clearing suggestions');
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    console.log('🎯 LocationInput: Suggestion selected:', suggestion);
    setQuery(suggestion.display_name);
    setSuggestions([]);
    
    const locationData = {
      name: suggestion.display_name,
      lat: parseFloat(suggestion.lat),
      lon: parseFloat(suggestion.lon)
    };
    console.log('🎯 LocationInput: Passing location data to parent:', locationData);
    onLocationSelected(locationData);
  };

  const handleDebugSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLat || !customLon || isNaN(Number(customLat)) || isNaN(Number(customLon))) {
      setError('Please enter valid latitude and longitude values.');
      return;
    }
    setError('');
    const locationData = {
      name: `Custom (${customLat}, ${customLon})`,
      lat: parseFloat(customLat),
      lon: parseFloat(customLon)
    };
    console.log('🐞 Debug Mode: Passing custom location data to parent:', locationData);
    onLocationSelected(locationData);
  };

  return (
    <div className="max-w-md mx-auto mt-24 p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold text-center flex-1">Enter Your Village or City</h2>
        <button
          className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${debugMode ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setDebugMode((d) => !d)}
          title="Toggle Debug Mode"
        >
          {debugMode ? 'Debug ON' : 'Debug OFF'}
        </button>
      </div>

      {!debugMode && (
        <>
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Type your village or city name..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {loading && <div className="mt-2 text-sm text-gray-500">Loading...</div>}
          {error && <div className="mt-2 text-sm text-red-500">{error}</div>}
          {suggestions.length > 0 && (
            <ul className="border border-gray-200 rounded-md mt-2 bg-white max-h-48 overflow-y-auto">
              {suggestions.map((s, idx) => (
                <li
                  key={idx}
                  className="px-4 py-2 hover:bg-green-100 cursor-pointer"
                  onClick={() => handleSuggestionClick(s)}
                >
                  {s.display_name}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {debugMode && (
        <form onSubmit={handleDebugSubmit} className="space-y-2 mt-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={customLat}
              onChange={e => setCustomLat(e.target.value)}
              placeholder="Latitude"
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="text"
              value={customLon}
              onChange={e => setCustomLon(e.target.value)}
              placeholder="Longitude"
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded-md font-semibold hover:bg-green-700 transition-colors"
          >
            Use Custom Lat/Lon
          </button>
          {error && <div className="text-sm text-red-500 mt-1">{error}</div>}
        </form>
      )}
    </div>
  );
};
