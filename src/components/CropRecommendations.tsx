import React, { useMemo } from 'react';
import { useAppData } from '../contexts/AppDataContext';
import { recommendCrops } from '../services/recommendation/recommendCrops';
import { extractSoilProperty, OpenEpiSoilResponse } from '../services/openepi';
import { useLanguage } from '../contexts/LanguageContext';

interface CropRecommendationsProps {
  limit?: number;
  compact?: boolean; // compact version for dashboard
}

export const CropRecommendations: React.FC<CropRecommendationsProps> = ({ limit = 5, compact = false }) => {
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
    }, limit);
  }, [ph, sand, silt, clay, soc, forecast, weatherRaw, limit]);

  if (loading) {
    return <div className="text-gray-500">Generating recommendations...</div>;
  }

  if (!forecast.length) {
    return <div className="text-sm text-gray-500">No forecast data available for recommendations.</div>;
  }

  const containerClasses = compact ? '' : 'bg-white rounded-lg shadow-sm border p-6 mt-6';
  return (
    <div className={containerClasses}>
      {!compact && <h3 className="text-lg font-semibold text-gray-800 mb-4">Crop Recommendations</h3>}
      <div className={compact ? 'space-y-3' : 'space-y-4'}>
        {recommendations.map(rec => {
          // New model: confidence already 0-100, overallScore 0-1
          const confPctRaw = typeof rec.confidence === 'number' ? rec.confidence : 0;
          const confPct = Math.max(0, Math.min(100, Math.round(confPctRaw)));
          const overallScore = (rec as any).overallScore ?? (rec as any).score; // fallback
          const scorePct = overallScore != null && !isNaN(overallScore) ? Math.round(overallScore * 100) : 0;
          const barColor = confPct >= 75 ? 'bg-green-500' : confPct >= 50 ? 'bg-yellow-500' : 'bg-red-500';
          return (
            <div key={rec.id} className={`border rounded-lg p-3 ${compact ? 'bg-white' : 'bg-gray-50'} hover:shadow-sm transition`}> 
              <div className="flex items-center justify-between mb-1">
                <div className="font-semibold text-gray-800 text-sm">{language === 'hi' ? rec.names.hindi : rec.names.english}</div>
                <div className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">{scorePct}%</div>
              </div>
              <div className="text-[11px] text-gray-500 capitalize mb-2">{rec.suitability}</div>
              {/* Confidence bar */}
              <div className="mb-2">
                <div className="h-2 w-full bg-gray-200 rounded">
                  <div className={`h-2 rounded ${barColor}`} style={{ width: `${confPct}%` }} />
                </div>
                <div className="text-[10px] text-gray-500 mt-1">Confidence: {confPct}%</div>
              </div>
              {/* Reasons (top 2) */}
              <ul className="text-[11px] text-gray-600 list-disc pl-4 space-y-0.5">
                {(language === 'hi' ? rec.reasons.hindi : rec.reasons.english).slice(0,2).map((r,i)=>(
                  <li key={i}>{r}</li>
                ))}
              </ul>
              {/* Limiting factors */}
              {rec.limitingFactors.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {rec.limitingFactors.map(f => (
                    <span key={f} className="inline-block bg-red-100 text-red-700 rounded px-2 py-0.5 text-[10px]">{f}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
