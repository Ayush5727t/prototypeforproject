
import React, { useState } from 'react';
import { Leaf, ChevronDown, ChevronRight } from 'lucide-react';
import { CropRecommendations } from './CropRecommendations';
import { useLanguage } from '../contexts/LanguageContext';
// Switched from LocationContext to AppDataContext to avoid missing provider error
import { useAppData } from '../contexts/AppDataContext';
import { extractSoilProperty, OpenEpiSoilResponse } from '../services/openepi';

export const InputForm: React.FC = () => {
  const { t } = useLanguage();
  // Use soil & location directly from AppDataContext
  const { location, soil, loading, error, soilError } = useAppData();
  const [soilOpen, setSoilOpen] = useState(true);

  // Type guard: verify soil resembles OpenEpi response
  const isOpenEpiSoil = (value: any): value is OpenEpiSoilResponse => {
    return !!value && typeof value === 'object' && value.properties && Array.isArray(value.properties.layers);
  };

  const soilData: OpenEpiSoilResponse | null = isOpenEpiSoil(soil) ? soil : null;
  
  // If location not set, prompt user (form shouldn't fetch anything itself)
  if (!location) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <p className="text-gray-600">Select a location first to view soil parameters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Soil Parameters (Expandable) */}
      <div className="bg-white rounded-lg shadow-sm border">
        <button
          type="button"
          onClick={() => setSoilOpen(o => !o)}
          className="w-full flex items-center justify-between px-6 py-4 focus:outline-none focus:ring-2 focus:ring-green-500 rounded-t-lg"
        >
          <div className="flex items-center space-x-2">
            <Leaf className="w-5 h-5 text-green-600" />
            <span className="text-lg font-semibold text-gray-800">{t('soilParameters')}</span>
            {loading && <span className="ml-2 text-xs text-gray-500 animate-pulse">Loading...</span>}
          </div>
          <div className="text-gray-500">
            {soilOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </div>
        </button>
        <div className={`${soilOpen ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden transition-all duration-300 ease-in-out`}> 
          <div className="px-6 pb-6 pt-2">
            {error && <div className="text-red-500 mb-2">{error}</div>}
            {soilError && <div className="text-amber-600 text-sm mb-2">Soil data unavailable: {soilError}</div>}
            {soilData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bulk density (bdod) */}
            {(() => {
              const prop = extractSoilProperty(soilData, 'bdod', '0-5cm', 'mean');
              return (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{prop ? prop.name : 'Bulk density (bdod)'}:</span>
                  <span>{prop ? `${prop.value} ${prop.unit}` : <span className="text-gray-400">null</span>}</span>
                </div>
              );
            })()}
            {/* Cation Exchange Capacity (cec) */}
            {(() => {
              const prop = extractSoilProperty(soilData, 'cec', '0-5cm', 'mean');
              return (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{prop ? prop.name : 'Cation Exchange Capacity (cec)'}:</span>
                  <span>{prop ? `${prop.value} ${prop.unit}` : <span className="text-gray-400">null</span>}</span>
                </div>
              );
            })()}
            {/* Coarse fragments volumetric (cfvo) */}
            {(() => {
              const prop = extractSoilProperty(soilData, 'cfvo', '0-5cm', 'mean');
              return (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{prop ? prop.name : 'Coarse fragments (cfvo)'}:</span>
                  <span>{prop ? `${prop.value} ${prop.unit}` : <span className="text-gray-400">null</span>}</span>
                </div>
              );
            })()}
            {/* Clay content (clay) */}
            {(() => {
              const prop = extractSoilProperty(soilData, 'clay', '0-5cm', 'mean');
              return (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{prop ? prop.name : 'Clay content (clay)'}:</span>
                  <span>{prop ? `${prop.value} ${prop.unit}` : <span className="text-gray-400">null</span>}</span>
                </div>
              );
            })()}
            {/* Nitrogen (nitrogen) */}
            {(() => {
              const prop = extractSoilProperty(soilData, 'nitrogen', '0-5cm', 'mean');
              return (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{prop ? prop.name : 'Nitrogen (nitrogen)'}:</span>
                  <span>{prop ? `${prop.value} ${prop.unit}` : <span className="text-gray-400">null</span>}</span>
                </div>
              );
            })()}
            {/* Organic carbon density (ocd) */}
            {(() => {
              const prop = extractSoilProperty(soilData, 'ocd', '0-5cm', 'mean');
              return (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{prop ? prop.name : 'Organic carbon density (ocd)'}:</span>
                  <span>{prop ? `${prop.value} ${prop.unit}` : <span className="text-gray-400">null</span>}</span>
                </div>
              );
            })()}
            {/* Organic carbon stocks (ocs) */}
            {(() => {
              const prop = extractSoilProperty(soilData, 'ocs', '0-5cm', 'mean');
              return (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{prop ? prop.name : 'Organic carbon stocks (ocs)'}:</span>
                  <span>{prop ? `${prop.value} ${prop.unit}` : <span className="text-gray-400">null</span>}</span>
                </div>
              );
            })()}
            {/* pH in H2O (phh2o) */}
            {(() => {
              const prop = extractSoilProperty(soilData, 'phh2o', '0-5cm', 'mean');
              return (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{prop ? prop.name : 'pH in H2O (phh2o)'}:</span>
                  <span>{prop ? `${prop.value} ${prop.unit}` : <span className="text-gray-400">null</span>}</span>
                </div>
              );
            })()}
            {/* Sand content (sand) */}
            {(() => {
              const prop = extractSoilProperty(soilData, 'sand', '0-5cm', 'mean');
              return (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{prop ? prop.name : 'Sand content (sand)'}:</span>
                  <span>{prop ? `${prop.value} ${prop.unit}` : <span className="text-gray-400">null</span>}</span>
                </div>
              );
            })()}
            {/* Silt content (silt) */}
            {(() => {
              const prop = extractSoilProperty(soilData, 'silt', '0-5cm', 'mean');
              return (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{prop ? prop.name : 'Silt content (silt)'}:</span>
                  <span>{prop ? `${prop.value} ${prop.unit}` : <span className="text-gray-400">null</span>}</span>
                </div>
              );
            })()}
            {/* Soil organic carbon (soc) */}
            {(() => {
              const prop = extractSoilProperty(soilData, 'soc', '0-5cm', 'mean');
              return (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{prop ? prop.name : 'Soil organic carbon (soc)'}:</span>
                  <span>{prop ? `${prop.value} ${prop.unit}` : <span className="text-gray-400">null</span>}</span>
                </div>
              );
            })()}
              </div>
            )}
            {!soilData && !loading && !error && (
              <div className="text-sm text-gray-500">No soil data available in context.</div>
            )}
            {!soilData && loading && (
              <div className="text-sm text-gray-500">Loading soil data...</div>
            )}
          </div>
        </div>
          </div>
      {/* Leave rest of the form blank for now */}
      <CropRecommendations />
    </div>
  );
}