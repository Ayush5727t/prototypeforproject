import React, { useMemo } from 'react';
import { 
  Home, 
  Settings, 
  Bell, 
  TrendingUp, 
  Cloud, 
  Thermometer, 
  Droplets,
  Sun,
  AlertTriangle,
  CheckCircle,
  Info,
  Calendar,
  MapPin,
  Activity
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAppData } from '../contexts/AppDataContext';
import { SoilDebugPanel } from './SoilDebugPanel';
import { CropRecommendations } from './CropRecommendations';
import { DashboardStats } from '../types';

interface DashboardProps {
  onNavigateToRecommendations: () => void;
  onNavigateToSettings: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  onNavigateToRecommendations, 
  onNavigateToSettings 
}) => {
  const { t, language } = useLanguage();
  const { location, weatherSummary, alerts, loading: weatherLoading, error: weatherError, refreshAlerts, refreshAll, isRefreshing, lastUpdated } = useAppData();

  // Derive dashboard stats dynamically
  const stats: DashboardStats = useMemo(() => {
    // Weighted, continuous scoring for weather
    let score = 100;
    if (weatherSummary) {
      // Temperature: ideal 20–32°C
      const temp = weatherSummary.temp;
      let tempPenalty = 0;
      if (temp < 20) tempPenalty = Math.min(20 - temp, 20) * 1.5; // up to -30
      else if (temp > 32) tempPenalty = Math.min(temp - 32, 20) * 1.5; // up to -30
      // Humidity: ideal 40–70%
      const humidity = weatherSummary.humidity;
      let humidityPenalty = 0;
      if (humidity < 40) humidityPenalty = Math.min(40 - humidity, 40) * 0.8; // up to -32
      else if (humidity > 70) humidityPenalty = Math.min(humidity - 70, 30) * 0.8; // up to -24
      // Rainfall: ideal 2–15mm
      const rain = weatherSummary.rainfallLast24h;
      let rainPenalty = 0;
      if (rain < 2) rainPenalty = Math.min(2 - rain, 2) * 5; // up to -10
      else if (rain > 15) rainPenalty = Math.min(rain - 15, 50) * 0.7; // up to -35
      // Alerts: -10 for high, -5 for medium, -2 for low
      let alertPenalty = 0;
      (alerts || []).forEach(a => {
        if (a.severity === 'high') alertPenalty += 10;
        else if (a.severity === 'medium') alertPenalty += 5;
        else if (a.severity === 'low') alertPenalty += 2;
      });
      score -= tempPenalty + humidityPenalty + rainPenalty + alertPenalty;
    } else {
      score = 0; // no data
    }
    score = Math.round(Math.max(0, Math.min(100, score)));
    return {
      totalRecommendations: 12, // TODO: wire real recommendations count
      activeAlerts: alerts.length,
      lastUpdated: new Date(),
      weatherScore: score
    };
  }, [weatherSummary, alerts]);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'danger':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  const getAlertBorderColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'danger':
        return 'border-l-red-500 bg-red-50';
      case 'info':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-green-500 bg-green-50';
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
  }> = ({ title, value, icon, color, subtitle }) => (
    <div className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const WeatherCard: React.FC = () => (
    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{t('weatherOverview')}</h3>
        <Sun className="w-6 h-6" />
      </div>
      {weatherLoading ? (
        <div className="text-center py-8">Loading weather...</div>
      ) : weatherError ? (
        <div className="text-center text-red-200 py-8">{weatherError}</div>
      ) : weatherSummary ? (
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <Thermometer className="w-5 h-5 mx-auto mb-1 opacity-80" />
            <p className="text-2xl font-bold">{weatherSummary.temp}°C</p>
            <p className="text-xs opacity-80">Temperature</p>
          </div>
          <div className="text-center">
            <Droplets className="w-5 h-5 mx-auto mb-1 opacity-80" />
            <p className="text-2xl font-bold">{weatherSummary.humidity}%</p>
            <p className="text-xs opacity-80">Humidity</p>
          </div>
          <div className="text-center">
            <Cloud className="w-5 h-5 mx-auto mb-1 opacity-80" />
            <p className="text-2xl font-bold">{weatherSummary.rainfallLast24h}mm</p>
            <p className="text-xs opacity-80">Rain 24h</p>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">No weather data</div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {language === 'hi' ? 'नमस्ते, किसान जी!' : 'Welcome, Farmer!'}
            </h2>
            <p className="text-gray-600 mt-1">
              {language === 'hi' 
                ? 'आज आपकी खेती के लिए क्या योजना है?' 
                : 'What\'s your farming plan for today?'
              }
            </p>
            {lastUpdated && (
              <p className="text-xs text-gray-400 mt-2">Last update: {lastUpdated.toLocaleTimeString()}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">{location ? location.name : 'No location selected'}</span>
            <button onClick={refreshAll} disabled={!location || isRefreshing} className="ml-2 text-xs px-2 py-1 border rounded disabled:opacity-50">
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('weatherScore')}
          value={`${stats.weatherScore}%`}
          icon={<TrendingUp className="w-6 h-6 text-white" />}
          color="bg-green-500"
          subtitle="Excellent conditions"
        />
        <StatCard
          title={t('totalRecommendations')}
          value={stats.totalRecommendations}
          icon={<CheckCircle className="w-6 h-6 text-white" />}
          color="bg-blue-500"
          subtitle="This season"
        />
        <StatCard
          title={t('activeAlerts')}
          value={stats.activeAlerts}
          icon={<Bell className="w-6 h-6 text-white" />}
          color="bg-yellow-500"
          subtitle="Requires attention"
        />
        <StatCard
          title={t('lastUpdated')}
          value="2 hrs"
          icon={<Activity className="w-6 h-6 text-white" />}
          color="bg-purple-500"
          subtitle="ago"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weather Overview */}
        <div className="lg:col-span-1">
          <WeatherCard />
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={onNavigateToRecommendations}
                className="flex items-center space-x-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
              >
                <div className="bg-green-500 p-2 rounded-lg">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-800">{t('newRecommendation')}</p>
                  <p className="text-sm text-gray-600">Get crop suggestions</p>
                </div>
              </button>
              
              <button
                onClick={onNavigateToSettings}
                className="flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
              >
                <div className="bg-blue-500 p-2 rounded-lg">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-800">{t('settings')}</p>
                  <p className="text-sm text-gray-600">Customize preferences</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Climate Alerts */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{t('alerts')}</h3>
          <div className="flex items-center space-x-2">
            <button onClick={refreshAlerts} disabled={!location || isRefreshing} className="text-sm text-green-600 hover:text-green-700 font-medium disabled:opacity-50">
              {isRefreshing ? '...' : 'Refresh Alerts'}
            </button>
          </div>
        </div>
        <div className="space-y-3">
          {alerts.length === 0 && (
            <div className="text-sm text-gray-500">No alerts</div>
          )}
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`border-l-4 p-4 rounded-r-lg ${getAlertBorderColor(alert.type)}`}
            >
              <div className="flex items-start space-x-3">
                {getAlertIcon(alert.type)}
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">
                    {/* Generated alerts currently English only */}
                    {alert.title}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1 break-words">
                    {/^https?:\/\//.test(alert.message) ? (
                      <a href={alert.message} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                        {alert.message}
                      </a>
                    ) : (
                      alert.message
                    )}
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-xs text-gray-500 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(alert.timestamp).toLocaleDateString()}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                      alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {t(alert.severity)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Crop Recommendations (Top 3) */}
      <div className="border-2 border-emerald-500 bg-emerald-50 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-emerald-800">Top Crop Recommendations</h3>
          <button
            onClick={onNavigateToRecommendations}
            className="text-xs font-medium text-emerald-700 hover:text-emerald-800 underline"
          >
            Full View
          </button>
        </div>
  <CropRecommendations limit={1} compact />
      </div>

      {/* Soil Debug Panel */}
      <SoilDebugPanel />
    </div>
  );
};