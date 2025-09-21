import React, { useMemo } from 'react';
import { useAppData } from '../contexts/AppDataContext';
import { recommendCrops } from '../services/recommendation/recommendCrops';
import { extractSoilProperty, OpenEpiSoilResponse } from '../services/openepi';
import { useLanguage } from '../contexts/LanguageContext';

export const CropRecommendations: React.FC = () => {
  const { weatherRaw, forecast, soil, loading } = useAppData();
  const { language } = useLanguage();

  const soilData: OpenEpiSoilResponse | null = soil && (soil as any).properties?.layers ? soil as OpenEpiSoilResponse : null;
  const ph = soilData ? extractSoilProperty(soilData, 'phh2o', '0-5cm', 'mean')?.value ?? null : null;
  const sand = soilData ? extractSoilProperty(soilData, 'sand', '0-5cm', 'mean')?.value ?? null : null;
  const silt = soilData ? extractSoilProperty(soilData, 'silt', '0-5cm', 'mean')?.value ?? null : null;
  const clay = soilData ? extractSoilProperty(soilData, 'clay', '0-5cm', 'mean')?.value ?? null : null;
  const soc = soilData ? extractSoilProperty(soilData, 'soc', '0-5cm', 'mean')?.value ?? null : null;

  const recommendations = useMemo(() => {
    return recommendCrops({
      ph,
      sand,
      silt,
      clay,
      orgCarbon: soc,
      forecast,
      rainfallLast24h: weatherRaw?.current.precipitationLastHour ?? 0
    }).slice(0,5);
  }, [ph, sand, silt, clay, soc, forecast, weatherRaw]);

  if (loading) {
    return <div className="text-gray-500">Generating recommendations...</div>;
  }

  if (!forecast.length) {
    return <div className="text-sm text-gray-500">No forecast data available for recommendations.</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Crop Recommendations</h3>
      <div className="space-y-4">
        {recommendations.map(rec => (
          <div key={rec.id} className="border rounded-lg p-4 hover:shadow-sm transition bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-gray-800">{language === 'hi' ? rec.names.hindi : rec.names.english}</div>
              <div className="text-sm font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">{Math.round(rec.score*100)}%</div>
            </div>
            <div className="text-xs text-gray-500 mb-2 capitalize">{rec.suitability}</div>
            <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
              {(language === 'hi' ? rec.reasons.hindi : rec.reasons.english).slice(0,3).map((r,i)=>(
                <li key={i}>{r}</li>
              ))}
            </ul>
            <div className="mt-2 text-[11px] text-gray-500">Confidence: {Math.round(rec.confidence*100)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
};
