import React, { createContext, useContext, useState, ReactNode } from 'react';
import { getLatLonFromLocation } from '../services/nominatim';
import { getWeatherData, CombinedWeatherData, DailyForecast, WeatherAlertGenerated } from '../services/openmeteo';
import { fetchNewsAlerts } from '../services/gdelt';
import { getSoilPropertiesOpenEpi } from '../services/openepi';

interface LocationData {
  name: string;
  lat: number;
  lon: number;
}

interface WeatherDataSummary {
  temp: number;
  humidity: number;
  rainfallLast24h: number;
}

interface SoilData {
  [key: string]: any;
}

interface AppDataContextType {
  location: LocationData | null;
  weatherRaw: CombinedWeatherData | null;
  weatherSummary: WeatherDataSummary | null;
  forecast: DailyForecast[];
  alerts: WeatherAlertGenerated[];
  soil: SoilData | null;
  loading: boolean;
  isRefreshing: boolean;
  error: string | null;
  soilError: string | null;
  lastUpdated: Date | null;
  setLocationAndFetch: (locationName: string) => Promise<void>;
  refreshAlerts: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [weatherRaw, setWeatherRaw] = useState<CombinedWeatherData | null>(null);
  const [weatherSummary, setWeatherSummary] = useState<WeatherDataSummary | null>(null);
  const [forecast, setForecast] = useState<DailyForecast[]>([]);
  const [alerts, setAlerts] = useState<WeatherAlertGenerated[]>([]);
  const [soil, setSoil] = useState<SoilData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [soilError, setSoilError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const setLocationAndFetch = async (locationName: string) => {
    console.log('🔍 Starting data fetch for location:', locationName);
    setLoading(true);
  setError(null);
  setSoilError(null);

    try {
      let locationData: LocationData | null = null;
      // Check if input is lat,lon or Custom (lat, lon) (custom coordinates)
      let latLonMatch = locationName.match(/^\s*(-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)\s*$/);
      if (!latLonMatch) {
        latLonMatch = locationName.match(/^Custom \((-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)\)$/);
      }
      if (latLonMatch) {
        const lat = parseFloat(latLonMatch[1]);
        const lon = parseFloat(latLonMatch[2]);
        locationData = {
          name: `Custom (${lat},${lon})`,
          lat,
          lon
        };
        console.log('📍 Using custom coordinates:', locationData);
      } else {
        // 1. Get location coordinates from geocoding
        console.log('📍 Fetching coordinates for location:', locationName);
        const locationResult = await getLatLonFromLocation(locationName);
        console.log('📍 Location result:', locationResult);
        if (!locationResult) {
          console.error('❌ Location not found');
          throw new Error('Location not found');
        }
        locationData = {
          name: locationName,
          lat: locationResult.lat,
          lon: locationResult.lon
        };
        console.log('✅ Location data set:', locationData);
      }
      setLocation(locationData);

      // 2. Fetch weather and soil data in parallel
      console.log('🌤️ Starting parallel fetch for weather and soil data...');
      console.log('🌤️ Weather API call with lat:', locationData.lat, 'lon:', locationData.lon);
      console.log('🏔️ Soil API call with lat:', locationData.lat, 'lon:', locationData.lon);

      // Fetch weather (critical) and soil (non-critical) separately so soil failure doesn't block weather
      const weatherDataPromise = getWeatherData(locationData.lat, locationData.lon);
      const soilDataPromise = getSoilPropertiesOpenEpi({
        lat: locationData.lat,
        lon: locationData.lon,
        properties: ['bdod', 'cec', 'cfvo', 'clay', 'nitrogen', 'ocd', 'ocs', 'phh2o', 'sand', 'silt', 'soc'],
        depths: ['0-5cm'],
        values: ['mean']
      }).catch(err => {
        console.error('🏔️ Soil fetch failed (continuing without soil):', err);
        setSoilError(err instanceof Error ? err.message : 'Soil fetch failed');
        return null;
      });

      const weatherData = await weatherDataPromise; // if this throws, we go to catch
      const soilData = await soilDataPromise; // may be null if failed

      console.log('🌤️ Raw weather data received:', weatherData);
      console.log('🏔️ Raw soil data received:', soilData);

      // 3. Store raw and derive summary
      console.log('⚙️ Processing combined weather data...');
      setWeatherRaw(weatherData);
      setForecast(weatherData.daily || []);
      setAlerts(weatherData.alerts || []); // Only internal alerts initially; news on explicit refresh

      // Compute rainfall last 24h using timestamps
      let last24h = 0;
      const openHourly = weatherData.raw?.openMeteo?.hourly;
      if (openHourly?.precipitation && Array.isArray(openHourly.precipitation) && Array.isArray(openHourly.time)) {
        const now = Date.now();
        const cutoff = now - 24 * 60 * 60 * 1000;
        for (let i = 0; i < openHourly.time.length; i++) {
          const ts = new Date(openHourly.time[i]).getTime();
            if (ts >= cutoff && ts <= now) {
            const val = openHourly.precipitation[i];
            if (typeof val === 'number') last24h += val;
          }
        }
      }
      const summary: WeatherDataSummary = {
        temp: weatherData.current.temperature,
        humidity: weatherData.current.humidity,
        rainfallLast24h: Math.round(last24h * 10)/10
      };
      console.log('✅ Weather summary computed:', summary);
      setWeatherSummary(summary);
      if (soilData) {
        setSoil(soilData);
        console.log('🎉 All data (including soil) successfully set in state!');
      } else {
        setSoil(null);
        console.log('🎉 Weather data set; soil unavailable.');
      }
      setLastUpdated(new Date());

    } catch (err) {
      console.error('💥 Error occurred during data fetch:', err);
      console.error('💥 Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : 'No stack trace',
        type: typeof err,
        err
      });
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      console.log('🏁 Data fetch process completed, setting loading to false');
      setLoading(false);
    }
  };

  // Explicit refresh of news alerts only
  const refreshAlerts = async () => {
    if (!location) return;
    setIsRefreshing(true);
    try {
      const news = await fetchNewsAlerts(['flood','drought','crop damage'], 8);
      if (news.length) {
        const mapped = news.slice(0,2).map(n => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          severity: n.severity,
          timestamp: n.timestamp
        }));
        setAlerts(mapped);
        console.log('📰 Alerts updated from GDELT (top 2)');
      } else {
        console.log('📰 No news alerts found; keeping existing alerts');
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.warn('📰 refreshAlerts failed', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Full refresh: weather + soil (no auto news) then optionally news
  const refreshAll = async () => {
    if (!location) return;
    setIsRefreshing(true);
    try {
      await setLocationAndFetch(location.name);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <AppDataContext.Provider value={{
      location,
      weatherRaw,
      weatherSummary,
      forecast,
      alerts,
      soil,
      loading,
      isRefreshing,
      error,
      soilError,
      lastUpdated,
      setLocationAndFetch,
      refreshAlerts,
      refreshAll
    }}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};
