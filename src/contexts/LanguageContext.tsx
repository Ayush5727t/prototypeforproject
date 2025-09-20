import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Language } from '../types';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    appTitle: 'AI Crop Recommendation Assistant',
    subtitle: 'Smart farming solutions for Jharkhand farmers',
    soilParameters: 'Soil Parameters',
    nitrogen: 'Nitrogen (N)',
    phosphorus: 'Phosphorus (P)',
    potassium: 'Potassium (K)',
    ph: 'pH Level',
    environmentalData: 'Environmental Data',
    temperature: 'Temperature (°C)',
    humidity: 'Humidity (%)',
    rainfall: 'Rainfall (mm)',
    farmingInfo: 'Farming Information',
    season: 'Season',
    kharif: 'Kharif (Monsoon)',
    rabi: 'Rabi (Winter)',
    irrigation: 'Irrigation Available',
    yes: 'Yes',
    no: 'No',
    getRecommendations: 'Get Crop Recommendations',
    loading: 'Analyzing soil and weather data...',
    recommendations: 'Crop Recommendations',
    score: 'Suitability Score',
    confidence: 'Confidence',
    reasons: 'Why this crop?',
    excellent: 'Excellent',
    good: 'Good',
    moderate: 'Moderate',
    poor: 'Poor',
    networkError: 'Network connection failed. Please check your internet connection.',
    serverError: 'Server error occurred. Please try again later.',
    validationError: 'Please fill in all required fields correctly.',
    retry: 'Retry',
    backToForm: 'Back to Form',
    mgPerKg: 'mg/kg',
    percent: '%',
    celsius: '°C',
    millimeters: 'mm',
    dashboard: 'Dashboard',
    settings: 'Settings',
    alerts: 'Climate Alerts',
    quickRecommendations: 'Quick Recommendations',
    weatherOverview: 'Weather Overview',
    recentActivity: 'Recent Activity',
    temperatureSettings: 'Temperature Settings',
    notificationSettings: 'Notification Settings',
    profileSettings: 'Profile Settings',
    enableNotifications: 'Enable Notifications',
    farmLocation: 'Farm Location',
    farmSize: 'Farm Size (acres)',
    save: 'Save Settings',
    cancel: 'Cancel',
    weatherScore: 'Weather Score',
    totalRecommendations: 'Total Recommendations',
    activeAlerts: 'Active Alerts',
    lastUpdated: 'Last Updated',
    viewAll: 'View All',
    newRecommendation: 'New Recommendation',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    warning: 'Warning',
    info: 'Info',
    danger: 'Danger'
  },
  hi: {
    appTitle: 'एआई फसल सिफारिश सहायक',
    subtitle: 'झारखंड के किसानों के लिए स्मार्ट खेती समाधान',
    soilParameters: 'मिट्टी के पैरामीटर',
    nitrogen: 'नाइट्रोजन (N)',
    phosphorus: 'फॉस्फोरस (P)',
    potassium: 'पोटैशियम (K)',
    ph: 'पीएच स्तर',
    environmentalData: 'पर्यावरणीय डेटा',
    temperature: 'तापमान (°C)',
    humidity: 'आर्द्रता (%)',
    rainfall: 'वर्षा (mm)',
    farmingInfo: 'खेती की जानकारी',
    season: 'मौसम',
    kharif: 'खरीफ (मानसून)',
    rabi: 'रबी (सर्दी)',
    irrigation: 'सिंचाई उपलब्ध',
    yes: 'हां',
    no: 'नहीं',
    getRecommendations: 'फसल सिफारिशें प्राप्त करें',
    loading: 'मिट्टी और मौसम डेटा का विश्लेषण...',
    recommendations: 'फसल सिफारिशें',
    score: 'उपयुक्तता स्कोर',
    confidence: 'विश्वसनीयता',
    reasons: 'यह फसल क्यों?',
    excellent: 'उत्कृष्ट',
    good: 'अच्छी',
    moderate: 'मध्यम',
    poor: 'खराब',
    networkError: 'नेटवर्क कनेक्शन विफल। कृपया अपना इंटरनेट कनेक्शन जांचें।',
    serverError: 'सर्वर त्रुटि हुई। कृपया बाद में पुनः प्रयास करें।',
    validationError: 'कृपया सभी आवश्यक फ़ील्ड सही तरीके से भरें।',
    retry: 'पुनः प्रयास करें',
    backToForm: 'फॉर्म पर वापस जाएं',
    mgPerKg: 'mg/kg',
    percent: '%',
    celsius: '°C',
    millimeters: 'mm',
    dashboard: 'डैशबोर्ड',
    settings: 'सेटिंग्स',
    alerts: 'जलवायु चेतावनी',
    quickRecommendations: 'त्वरित सिफारिशें',
    weatherOverview: 'मौसम अवलोकन',
    recentActivity: 'हाल की गतिविधि',
    temperatureSettings: 'तापमान सेटिंग्स',
    notificationSettings: 'सूचना सेटिंग्स',
    profileSettings: 'प्रोफ़ाइल सेटिंग्स',
    enableNotifications: 'सूचनाएं सक्षम करें',
    farmLocation: 'खेत का स्थान',
    farmSize: 'खेत का आकार (एकड़)',
    save: 'सेटिंग्स सहेजें',
    cancel: 'रद्द करें',
    weatherScore: 'मौसम स्कोर',
    totalRecommendations: 'कुल सिफारिशें',
    activeAlerts: 'सक्रिय चेतावनी',
    lastUpdated: 'अंतिम अपडेट',
    viewAll: 'सभी देखें',
    newRecommendation: 'नई सिफारिश',
    high: 'उच्च',
    medium: 'मध्यम',
    low: 'कम',
    warning: 'चेतावनी',
    info: 'जानकारी',
    danger: 'खतरा'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('hi'); // Default to Hindi for Jharkhand farmers

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};