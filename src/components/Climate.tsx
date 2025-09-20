import React from 'react';
import { 
  Cloud, 
  Thermometer, 
  Droplets, 
  Wind, 
  Sun, 
  CloudRain, 
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  CheckCircle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAppData } from '../contexts/AppDataContext';

// Using context-provided data; no internal WeatherData interface needed

export const Climate: React.FC = () => {
  useLanguage(); // keep hook in place for future localization (no currently used strings)
  const { location, weatherRaw, weatherSummary, forecast, alerts, loading, error } = useAppData();

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'danger': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
      default: return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  const getAlertBorderColor = (type: string) => {
    switch (type) {
      case 'warning': return 'border-l-yellow-500 bg-yellow-50';
      case 'danger': return 'border-l-red-500 bg-red-50';
      case 'info': return 'border-l-blue-500 bg-blue-50';
      default: return 'border-l-green-500 bg-green-50';
    }
  };

  const WeatherCard: React.FC<{
    title: string;
    value: string | number;
    unit: string;
    icon: React.ReactNode;
    trend?: 'up' | 'down';
    color: string;
  }> = ({ title, value, unit, icon, trend, color }) => (
    <div className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center ${trend === 'up' ? 'text-red-500' : 'text-blue-500'}`}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          </div>
        )}
      </div>
      <div className="mt-3">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <p className="text-2xl font-bold text-gray-900 mt-1">
          {value}<span className="text-lg text-gray-600">{unit}</span>
        </p>
      </div>
    </div>
  );

  const ForecastCard: React.FC<{
    date: string;
    maxTemp: number;
    minTemp: number;
    precipitation: number;
    description: string;
  }> = ({ date, maxTemp, minTemp, precipitation, description }) => (
    <div className="bg-white rounded-lg p-4 shadow-sm border">
      <div className="text-center">
        <p className="text-sm font-medium text-gray-600">
          {new Date(date).toLocaleDateString('en', { weekday: 'short', day: 'numeric' })}
        </p>
        <div className="flex items-center justify-center my-3">
          {precipitation > 0 ? (
            <CloudRain className="w-8 h-8 text-blue-500" />
          ) : (
            <Sun className="w-8 h-8 text-yellow-500" />
          )}
        </div>
        <div className="space-y-1">
          <p className="text-lg font-bold text-gray-900">{Math.round(maxTemp)}°</p>
          <p className="text-sm text-gray-600">{Math.round(minTemp)}°</p>
          <p className="text-xs text-gray-500">{precipitation}mm</p>
        </div>
        <p className="text-xs text-gray-600 mt-2">{description}</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
          <h3 className="text-lg font-semibold text-gray-800">Loading Climate Data...</h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
          <h3 className="text-lg font-semibold text-gray-800">Error Loading Climate Data</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Cloud className="w-16 h-16 text-gray-400 mx-auto" />
          <h3 className="text-lg font-semibold text-gray-800">No Location Selected</h3>
          <p className="text-gray-600">Please select a location to view climate data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Climate Overview</h2>
            <p className="text-gray-600 mt-1">Weather and climate data for {location.name}</p>
          </div>
          <div className="flex items-center space-x-2 text-gray-500">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Updated: {new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Current Weather Cards */}
      {weatherSummary && weatherRaw && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <WeatherCard
            title="Temperature"
            value={Math.round(weatherSummary.temp)}
            unit="°C"
            icon={<Thermometer className="w-6 h-6 text-white" />}
            trend="up"
            color="bg-red-500"
          />
          <WeatherCard
            title="Humidity"
            value={Math.round(weatherSummary.humidity)}
            unit="%"
            icon={<Droplets className="w-6 h-6 text-white" />}
            color="bg-blue-500"
          />
          <WeatherCard
            title="Wind Speed"
            value={Math.round(weatherRaw.current.windSpeed)}
            unit=" km/h"
            icon={<Wind className="w-6 h-6 text-white" />}
            color="bg-gray-500"
          />
          <WeatherCard
            title="Pressure"
            value={weatherSummary.rainfallLast24h}
            unit=" mm"
            icon={<CloudRain className="w-6 h-6 text-white" />}
            color="bg-purple-500"
          />
          <WeatherCard
            title="Precip Now"
            value={weatherRaw.current.precipitationLastHour}
            unit=" mm"
            icon={<CloudRain className="w-6 h-6 text-white" />}
            color="bg-green-500"
          />
          <WeatherCard
            title="Forecast Days"
            value={forecast.length}
            unit=" d"
            icon={<Sun className="w-6 h-6 text-white" />}
            color="bg-yellow-500"
          />
        </div>
      )}

      {/* 7-Day Forecast */}
      {forecast && forecast.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">7-Day Forecast</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
            {forecast.slice(0,7).map((day, index) => (
              <ForecastCard
                key={index}
                date={day.date}
                maxTemp={day.maxTemp}
                minTemp={day.minTemp}
                precipitation={day.totalPrecipMm}
                description={day.description}
              />
            ))}
          </div>
        </div>
      )}

      {/* Climate Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Climate Alerts</h3>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`border-l-4 p-4 rounded-r-lg ${getAlertBorderColor(alert.type)}`}
              >
                <div className="flex items-start space-x-3">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{alert.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                    <span className={`text-xs px-2 py-1 rounded-full mt-2 inline-block ${
                      alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                      alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Climate Insights */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-lg p-6 text-white">
        <h3 className="text-lg font-semibold mb-4">Climate Insights for Farming</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <h4 className="font-medium mb-2">Growing Conditions</h4>
            <p className="text-sm opacity-90">
              Current conditions are {weatherSummary?.temp && weatherSummary.temp > 30 ? 'hot' : 'moderate'} with 
              {weatherSummary?.humidity && weatherSummary.humidity > 70 ? ' high humidity' : ' moderate humidity'}. 
              {weatherSummary && weatherSummary.temp > 25 && weatherSummary.humidity > 60 ? 
                ' Ideal for rice and other tropical crops.' : 
                ' Good for wheat and winter crops.'}
            </p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <h4 className="font-medium mb-2">Irrigation Recommendation</h4>
            <p className="text-sm opacity-90">
              {forecast?.some(day => day.totalPrecipMm > 5) ? 
                'Expected rainfall in coming days. Reduce irrigation accordingly.' :
                'Low precipitation expected. Plan for adequate irrigation.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};