export interface SoilData {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  ph: number;
}

export interface EnvironmentalData {
  temperature: number;
  humidity: number;
  rainfall: number;
}

export interface FarmingData {
  season: 'kharif' | 'rabi';
  irrigation: boolean;
}

export interface CropRecommendationRequest {
  soil: SoilData;
  environmental: EnvironmentalData;
  farming: FarmingData;
}

export interface CropRecommendation {
  cropName: {
    english: string;
    hindi: string;
  };
  score: number;
  confidence: number;
  reasons: {
    english: string[];
    hindi: string[];
  };
  suitability: 'excellent' | 'good' | 'moderate' | 'poor';
}

export interface ApiResponse {
  success: boolean;
  recommendations: CropRecommendation[];
  message?: string;
}

export interface WeatherAlert {
  id: string;
  type: 'warning' | 'info' | 'danger';
  title: {
    english: string;
    hindi: string;
  };
  message: {
    english: string;
    hindi: string;
  };
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
}

export interface DashboardStats {
  totalRecommendations: number;
  activeAlerts: number;
  lastUpdated: Date;
  weatherScore: number;
}

export interface UserSettings {
  temperatureUnit: 'celsius' | 'fahrenheit';
  notifications: boolean;
  language: Language;
  location: string;
  farmSize: number;
}

export type Language = 'en' | 'hi';