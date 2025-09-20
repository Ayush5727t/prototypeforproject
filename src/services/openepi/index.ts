// OpenEpi Soil Property API service

export interface SoilLayer {
  code: string;
  name: string;
  unit_measure: {
    mapped_units: string;
    target_units: string;
    conversion_factor: number;
    uncertainty_unit: string;
  };
  depths: Array<{
    range: {
      top_depth: number;
      bottom_depth: number;
      unit_depth: string;
    };
    label: string;
    values: Record<string, number>;
  }>;
}

export interface OpenEpiSoilResponse {
  type: string;
  geometry: {
    coordinates: [number, number];
    type: string;
  };
  properties: {
    layers: SoilLayer[];
  };
}

/**
 * Fetch soil property data from OpenEpi API for given lat/lon, depths, and properties.
 * @param lat Latitude
 * @param lon Longitude
 * @param properties Array of property codes (e.g., ['bdod', 'phh2o'])
 * @param depths Array of depth labels (e.g., ['0-5cm', '100-200cm'])
 * @param values Array of value types (e.g., ['mean', 'Q0.05'])
 */
export async function getSoilPropertiesOpenEpi({
  lat,
  lon,
  properties = ['bdod', 'phh2o'],
  depths = ['0-5cm'],
  values = ['mean']
}: {
  lat: number;
  lon: number;
  properties?: string[];
  depths?: string[];
  values?: string[];
}): Promise<OpenEpiSoilResponse> {
  console.log('🏔️ OpenEpi: Fetching soil data for coordinates:', { lat, lon });
  console.log('🏔️ OpenEpi: Request parameters:', { properties, depths, values });
  
  const params = new URLSearchParams();
  params.append('lon', lon.toString());
  params.append('lat', lat.toString());
  
  // Add each property, depth, and value as separate parameters
  properties.forEach(prop => params.append('properties', prop));
  depths.forEach(depth => params.append('depths', depth));
  values.forEach(value => params.append('values', value));
  
  const url = `https://api.openepi.io/soil/property?${params.toString()}`;
  console.log('🏔️ OpenEpi: Request URL:', url);
  
  try {
    const response = await fetch(url);
    console.log('🏔️ OpenEpi: Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      console.error('🏔️ OpenEpi: Request failed:', response.status, response.statusText);
      throw new Error(`OpenEpi API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('🏔️ OpenEpi: Raw API response:', data);
    console.log('🏔️ OpenEpi: Response type:', data.type);
    console.log('🏔️ OpenEpi: Geometry:', data.geometry);
    console.log('🏔️ OpenEpi: Properties layers count:', data.properties?.layers?.length || 'No layers');
    
    if (data.properties?.layers) {
      data.properties.layers.forEach((layer: SoilLayer, index: number) => {
        console.log(`🏔️ OpenEpi: Layer ${index + 1} - ${layer.code} (${layer.name}):`, {
          unit: layer.unit_measure,
          depths: layer.depths?.length || 0
        });
      });
    }
    
    return data;
  } catch (error) {
    console.error('🏔️ OpenEpi: Error occurred:', error);
    throw error;
  }
}

/**
 * Helper to extract a property value from OpenEpi response
 */
export function extractSoilProperty(
  response: OpenEpiSoilResponse,
  propertyCode: string,
  depthLabel: string,
  valueType: string = 'mean'
): { name: string; value: number | null; unit: string; depth: string } | null {
  console.log(`🔍 ExtractSoilProperty: Looking for ${propertyCode} at depth ${depthLabel} with value type ${valueType}`);
  console.log('🔍 ExtractSoilProperty: Available layers:', response.properties?.layers?.map(l => l.code) || 'No layers');
  
  const layer = response.properties.layers.find(l => l.code === propertyCode);
  if (!layer) {
    console.warn(`🔍 ExtractSoilProperty: Layer ${propertyCode} not found`);
    return null;
  }
  
  console.log(`🔍 ExtractSoilProperty: Found layer ${propertyCode}:`, {
    name: layer.name,
    code: layer.code,
    unit: layer.unit_measure,
    depths: layer.depths?.map(d => d.label) || 'No depths'
  });
  
  const depth = layer.depths.find(d => d.label === depthLabel);
  if (!depth) {
    console.warn(`🔍 ExtractSoilProperty: Depth ${depthLabel} not found for ${propertyCode}`);
    return null;
  }
  
  console.log(`🔍 ExtractSoilProperty: Found depth ${depthLabel}:`, {
    label: depth.label,
    values: depth.values,
    availableValueTypes: Object.keys(depth.values || {}),
    requestedValueType: valueType,
    extractedValue: depth.values[valueType]
  });
  
  const result = {
    name: layer.name,
    value: depth.values[valueType] ?? null,
    unit: layer.unit_measure.mapped_units,
    depth: depth.label
  };
  
  console.log(`🔍 ExtractSoilProperty: Final result for ${propertyCode}:`, result);
  return result;
}
