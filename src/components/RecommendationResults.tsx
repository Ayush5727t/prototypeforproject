import React from 'react';
import { ArrowLeft, Star, TrendingUp, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { CropRecommendation } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface RecommendationResultsProps {
  recommendations: CropRecommendation[];
  onBack: () => void;
}

export const RecommendationResults: React.FC<RecommendationResultsProps> = ({ 
  recommendations, 
  onBack 
}) => {
  const { t, language } = useLanguage();

  const getSuitabilityIcon = (suitability: string) => {
    switch (suitability) {
      case 'excellent':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'good':
        return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case 'moderate':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'poor':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSuitabilityColor = (suitability: string) => {
    switch (suitability) {
      case 'excellent':
        return 'bg-green-50 border-green-200';
      case 'good':
        return 'bg-blue-50 border-blue-200';
      case 'moderate':
        return 'bg-yellow-50 border-yellow-200';
      case 'poor':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-blue-600 bg-blue-100';
    if (score >= 0.4) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

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
        <h2 className="text-xl font-bold text-gray-800">{t('recommendations')}</h2>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {recommendations.map((crop, index) => (
          <div
            key={index}
            className={`${getSuitabilityColor(crop.suitability)} border rounded-lg p-6 shadow-sm transition-all hover:shadow-md`}
          >
            {/* Crop Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-gray-600">#{index + 1}</span>
                  {getSuitabilityIcon(crop.suitability)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {language === 'hi' ? crop.cropName.hindi : crop.cropName.english}
                  </h3>
                  <p className="text-sm text-gray-600 capitalize">
                    {t(crop.suitability)}
                  </p>
                </div>
              </div>
              
              {/* Scores */}
              <div className="flex space-x-4">
                <div className="text-center">
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(crop.score)}`}>
                    {Math.round(crop.score * 100)}%
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{t('score')}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center space-x-1 px-3 py-1 bg-gray-100 rounded-full">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    <span className="text-sm font-bold text-gray-700">
                      {Math.round(crop.confidence * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{t('confidence')}</p>
                </div>
              </div>
            </div>

            {/* Reasons */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">{t('reasons')}</h4>
              <ul className="space-y-1">
                {(language === 'hi' ? crop.reasons.hindi : crop.reasons.english).map((reason, reasonIndex) => (
                  <li key={reasonIndex} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-gray-600">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          {language === 'hi' 
            ? 'ये सिफारिशें आपके द्वारा प्रदान किए गए डेटा पर आधारित हैं। अधिक सटीक सलाह के लिए स्थानीय कृषि विशेषज्ञ से सलाह लें।'
            : 'These recommendations are based on the data you provided. For more accurate advice, consult with local agricultural experts.'
          }
        </p>
      </div>
    </div>
  );
};