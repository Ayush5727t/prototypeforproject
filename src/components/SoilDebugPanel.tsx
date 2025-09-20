import React from 'react';
import { useAppData } from '../contexts/AppDataContext';

export const SoilDebugPanel: React.FC = () => {
  const { soil, loading, location } = useAppData();

  if (!location) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">🌱 Soil Debug Panel</h3>
        <p className="text-yellow-700">No location selected yet</p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
      <h3 className="text-lg font-semibold text-blue-800 mb-4">🌱 Soil Debug Panel</h3>
      
      <div className="mb-4">
        <strong>Location:</strong> {location.name} ({location.lat}, {location.lon})
      </div>
      
      <div className="mb-4">
        <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
      </div>
      
      <div className="mb-4">
        <strong>Soil Data Available:</strong> {soil ? 'Yes' : 'No'}
      </div>
      
      {soil ? (
        <div className="space-y-4">
          <div>
            <strong>Raw Soil Data Structure:</strong>
            <pre className="bg-white p-2 rounded text-xs mt-2 overflow-auto max-h-40">
              {JSON.stringify(soil, null, 2)}
            </pre>
          </div>
          
          {soil.properties?.layers ? (
            <div>
              <strong>Available Soil Layers ({soil.properties.layers.length}):</strong>
              <div className="grid grid-cols-1 gap-2 mt-2">
                {soil.properties.layers.map((layer: any, index: number) => (
                  <div key={index} className="bg-white p-3 rounded border">
                    <div><strong>Code:</strong> {layer.code}</div>
                    <div><strong>Name:</strong> {layer.name}</div>
                    <div><strong>Unit:</strong> {layer.unit_measure?.mapped_units || 'N/A'}</div>
                    <div><strong>Depths:</strong> {layer.depths?.length || 0}</div>
                    {layer.depths?.map((depth: any, dIndex: number) => (
                      <div key={dIndex} className="ml-4 mt-2 p-2 bg-gray-50 rounded">
                        <div><strong>Depth:</strong> {depth.label}</div>
                        <div><strong>Values:</strong></div>
                        <div className="ml-4">
                          {Object.entries(depth.values || {}).map(([key, value]: [string, any]) => (
                            <div key={key}>
                              <strong>{key}:</strong> {value !== null ? value : 'null'}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-red-600">
              <strong>No soil layers found in data!</strong>
            </div>
          )}
        </div>
      ) : (
        <div className="text-gray-600">
          No soil data loaded yet
        </div>
      )}
    </div>
  );
};