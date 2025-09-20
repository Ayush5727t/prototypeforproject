import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center space-x-2 bg-white rounded-lg p-1 shadow-sm border">
      <Languages className="w-4 h-4 text-green-600" />
      <button
        onClick={() => setLanguage('hi')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          language === 'hi'
            ? 'bg-green-600 text-white'
            : 'text-gray-600 hover:text-green-600'
        }`}
      >
        हिन्दी
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          language === 'en'
            ? 'bg-green-600 text-white'
            : 'text-gray-600 hover:text-green-600'
        }`}
      >
        English
      </button>
    </div>
  );
};