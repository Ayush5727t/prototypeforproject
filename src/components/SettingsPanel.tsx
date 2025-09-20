import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Thermometer, 
  Bell, 
  User, 
  MapPin, 
  Save,
  X
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { UserSettings } from '../types';

interface SettingsPanelProps {
  onBack: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onBack }) => {
  const { t, language, setLanguage } = useLanguage();
  
  const [settings, setSettings] = useState<UserSettings>({
    temperatureUnit: 'celsius',
    notifications: true,
    language: language,
    location: 'Ranchi, Jharkhand',
    farmSize: 5
  });

  const [activeTab, setActiveTab] = useState<'temperature' | 'notifications' | 'profile'>('temperature');

  const handleSave = () => {
    // Save settings logic here
    console.log('Saving settings:', settings);
    onBack();
  };

  const SettingCard: React.FC<{
    title: string;
    children: React.ReactNode;
    icon: React.ReactNode;
  }> = ({ title, children, icon }) => (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <div className="flex items-center space-x-3 mb-4">
        <div className="bg-green-100 p-2 rounded-lg">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>
      {children}
    </div>
  );

  const TabButton: React.FC<{
    id: string;
    label: string;
    icon: React.ReactNode;
    active: boolean;
    onClick: () => void;
  }> = ({ id, label, icon, active, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
        active 
          ? 'bg-green-600 text-white' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-green-600 hover:text-green-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t('backToForm')}</span>
        </button>
        <h2 className="text-xl font-bold text-gray-800">{t('settings')}</h2>
        <div className="w-20"></div> {/* Spacer for centering */}
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2">
        <TabButton
          id="temperature"
          label={t('temperatureSettings')}
          icon={<Thermometer className="w-4 h-4" />}
          active={activeTab === 'temperature'}
          onClick={() => setActiveTab('temperature')}
        />
        <TabButton
          id="notifications"
          label={t('notificationSettings')}
          icon={<Bell className="w-4 h-4" />}
          active={activeTab === 'notifications'}
          onClick={() => setActiveTab('notifications')}
        />
        <TabButton
          id="profile"
          label={t('profileSettings')}
          icon={<User className="w-4 h-4" />}
          active={activeTab === 'profile'}
          onClick={() => setActiveTab('profile')}
        />
      </div>

      {/* Settings Content */}
      <div className="space-y-6">
        {/* Temperature Settings */}
        {activeTab === 'temperature' && (
          <SettingCard
            title={t('temperatureSettings')}
            icon={<Thermometer className="w-5 h-5 text-green-600" />}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature Unit
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="celsius"
                      checked={settings.temperatureUnit === 'celsius'}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        temperatureUnit: e.target.value as 'celsius' | 'fahrenheit' 
                      }))}
                      className="text-green-600"
                    />
                    <span>Celsius (°C)</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="fahrenheit"
                      checked={settings.temperatureUnit === 'fahrenheit'}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        temperatureUnit: e.target.value as 'celsius' | 'fahrenheit' 
                      }))}
                      className="text-green-600"
                    />
                    <span>Fahrenheit (°F)</span>
                  </label>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Thermometer className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Current Temperature</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">
                  {settings.temperatureUnit === 'celsius' ? '28°C' : '82°F'}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Perfect for Kharif season crops
                </p>
              </div>
            </div>
          </SettingCard>
        )}

        {/* Notification Settings */}
        {activeTab === 'notifications' && (
          <SettingCard
            title={t('notificationSettings')}
            icon={<Bell className="w-5 h-5 text-green-600" />}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-800">{t('enableNotifications')}</h4>
                  <p className="text-sm text-gray-600">
                    Receive alerts about weather and crop recommendations
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      notifications: e.target.checked 
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-800">Notification Types</h4>
                {[
                  { id: 'weather', label: 'Weather Alerts', enabled: true },
                  { id: 'crop', label: 'Crop Recommendations', enabled: true },
                  { id: 'market', label: 'Market Prices', enabled: false },
                  { id: 'seasonal', label: 'Seasonal Tips', enabled: true }
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      className="text-green-600 rounded"
                      disabled={!settings.notifications}
                    />
                  </div>
                ))}
              </div>
            </div>
          </SettingCard>
        )}

        {/* Profile Settings */}
        {activeTab === 'profile' && (
          <SettingCard
            title={t('profileSettings')}
            icon={<User className="w-5 h-5 text-green-600" />}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('farmLocation')}
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={settings.location}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      location: e.target.value 
                    }))}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter your farm location"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('farmSize')}
                </label>
                <input
                  type="number"
                  value={settings.farmSize}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    farmSize: parseFloat(e.target.value) || 0 
                  }))}
                  min="0"
                  step="0.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter farm size in acres"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language Preference
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="hi"
                      checked={settings.language === 'hi'}
                      onChange={(e) => {
                        const newLang = e.target.value as 'en' | 'hi';
                        setSettings(prev => ({ ...prev, language: newLang }));
                        setLanguage(newLang);
                      }}
                      className="text-green-600"
                    />
                    <span>हिन्दी</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="en"
                      checked={settings.language === 'en'}
                      onChange={(e) => {
                        const newLang = e.target.value as 'en' | 'hi';
                        setSettings(prev => ({ ...prev, language: newLang }));
                        setLanguage(newLang);
                      }}
                      className="text-green-600"
                    />
                    <span>English</span>
                  </label>
                </div>
              </div>
            </div>
          </SettingCard>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4 pt-6 border-t">
        <button
          onClick={handleSave}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>{t('save')}</span>
        </button>
        <button
          onClick={onBack}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <X className="w-4 h-4" />
          <span>{t('cancel')}</span>
        </button>
      </div>
    </div>
  );
};