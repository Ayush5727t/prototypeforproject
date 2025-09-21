import React, { useState } from 'react';
import { Leaf, Home, Settings as SettingsIcon, Cloud, Menu, X } from 'lucide-react';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { AppDataProvider, useAppData } from './contexts/AppDataContext';
import { LanguageToggle } from './components/LanguageToggle';
import { Dashboard } from './components/Dashboard';
import { SettingsPanel } from './components/SettingsPanel';
import { InputForm } from './components/InputForm';
import { LocationInput } from './components/LocationInput';
import { Climate } from './components/Climate';

type AppState = 'location' | 'dashboard' | 'form' | 'loading' | 'results' | 'error' | 'settings' | 'climate';


const AppContent: React.FC = () => {
  const { t } = useLanguage();
  const { setLocationAndFetch } = useAppData();
  const [state, setState] = useState<AppState>('location');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Navigation logic
  const handleNavigateToDashboard = () => {
    setState('dashboard');
    setSidebarOpen(false);
  };
  const handleNavigateToRecommendations = () => {
    setState('form');
    setSidebarOpen(false);
  };
  const handleNavigateToSettings = () => {
    setState('settings');
    setSidebarOpen(false);
  };
  const handleNavigateToClimate = () => {
    setState('climate');
    setSidebarOpen(false);
  };

  // When location is selected, fetch all data and go to dashboard
  const handleLocationSelected = async (loc: { name: string; lat: number; lon: number }) => {
    await setLocationAndFetch(loc.name);
    setState('dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex">
      {/* Left Sidebar Navigation */}
      {state !== 'location' && (
        <div className={`bg-white shadow-lg transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} flex flex-col`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="bg-green-600 p-3 rounded-lg">
                <Leaf className="w-8 h-8 text-white" />
              </div>
              {sidebarOpen && (
                <div>
                  <h1 className="text-lg font-bold text-gray-900">SAMPR</h1>
                  <p className="text-sm text-gray-600">Farm Assistant</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4">
            <div className="space-y-3">
              <button
                onClick={handleNavigateToDashboard}
                className={`w-full flex items-center justify-center ${sidebarOpen ? 'justify-start' : ''} space-x-3 px-4 py-4 rounded-lg font-medium transition-colors ${
                  state === 'dashboard' 
                    ? 'bg-green-600 text-white' 
                    : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
                }`}
              >
                <Home className="w-7 h-7" />
                {sidebarOpen && <span className="text-base">{t('dashboard')}</span>}
              </button>
              
              <button
                onClick={handleNavigateToRecommendations}
                className={`w-full flex items-center justify-center ${sidebarOpen ? 'justify-start' : ''} space-x-3 px-4 py-4 rounded-lg font-medium transition-colors ${
                  state === 'form' 
                    ? 'bg-green-600 text-white' 
                    : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
                }`}
              >
                <Leaf className="w-7 h-7" />
                {sidebarOpen && <span className="text-base">{t('recommendations')}</span>}
              </button>
              
              <button
                onClick={handleNavigateToClimate}
                className={`w-full flex items-center justify-center ${sidebarOpen ? 'justify-start' : ''} space-x-3 px-4 py-4 rounded-lg font-medium transition-colors ${
                  state === 'climate' 
                    ? 'bg-green-600 text-white' 
                    : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
                }`}
              >
                <Cloud className="w-7 h-7" />
                {sidebarOpen && <span className="text-base">Climate</span>}
              </button>
              
              <button
                onClick={handleNavigateToSettings}
                className={`w-full flex items-center justify-center ${sidebarOpen ? 'justify-start' : ''} space-x-3 px-4 py-4 rounded-lg font-medium transition-colors ${
                  state === 'settings' 
                    ? 'bg-green-600 text-white' 
                    : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
                }`}
              >
                <SettingsIcon className="w-7 h-7" />
                {sidebarOpen && <span className="text-base">{t('settings')}</span>}
              </button>
            </div>
          </nav>

          {/* Sidebar Toggle */}
          <div className="p-4 border-t">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-full flex items-center justify-center p-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        {state !== 'location' && (
          <header className="bg-white shadow-sm border-b">
            <div className="px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {t('appTitle')}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {t('subtitle')}
                  </p>
                </div>
                <LanguageToggle />
              </div>
            </div>
          </header>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {state === 'location' && (
            <LocationInput onLocationSelected={handleLocationSelected} />
          )}
          {state === 'dashboard' && (
            <Dashboard 
              onNavigateToRecommendations={handleNavigateToRecommendations}
              onNavigateToSettings={handleNavigateToSettings}
            />
          )}
          {state === 'climate' && <Climate />}
          {state === 'settings' && (
            <SettingsPanel onBack={handleNavigateToDashboard} />
          )}
          {state === 'form' && (
            <InputForm 
              onSubmit={() => {}} 
              loading={false}
            />
          )}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <LanguageProvider>
      <AppDataProvider>
        <AppContent />
      </AppDataProvider>
    </LanguageProvider>
  );
}

export default App;