import React from 'react';
import { AlertTriangle, Wifi, RefreshCw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ErrorMessageProps {
  error: string;
  onRetry: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, onRetry }) => {
  const { t } = useLanguage();

  const getErrorInfo = (errorType: string) => {
    switch (errorType) {
      case 'NETWORK_ERROR':
        return {
          icon: <Wifi className="w-8 h-8 text-red-500" />,
          title: t('networkError'),
          color: 'red'
        };
      case 'SERVER_ERROR':
        return {
          icon: <AlertTriangle className="w-8 h-8 text-orange-500" />,
          title: t('serverError'),
          color: 'orange'
        };
      case 'VALIDATION_ERROR':
        return {
          icon: <AlertTriangle className="w-8 h-8 text-yellow-500" />,
          title: t('validationError'),
          color: 'yellow'
        };
      default:
        return {
          icon: <AlertTriangle className="w-8 h-8 text-red-500" />,
          title: t('serverError'),
          color: 'red'
        };
    }
  };

  const errorInfo = getErrorInfo(error);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4 max-w-md">
        <div className="flex justify-center">
          {errorInfo.icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-800">
          {errorInfo.title}
        </h3>
        <button
          onClick={onRetry}
          className={`inline-flex items-center space-x-2 px-6 py-3 bg-${errorInfo.color}-600 hover:bg-${errorInfo.color}-700 text-white font-semibold rounded-lg transition-colors`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>{t('retry')}</span>
        </button>
      </div>
    </div>
  );
};