// Sample crop requirement dataset (extensible)
// All numeric ranges are inclusive. Units:
// temperature: °C (optimal day average)
// rainfall: mm over next 7 days (approx forecast sum)
// pH: unitless
// soilTexture: derived from sand/silt/clay percentages (simple USDA-inspired buckets)

export interface CropRequirements {
  id: string;
  names: { english: string; hindi: string };
  temperatureRange: [number, number];
  rainfallRange: [number, number];
  phRange: [number, number];
  texture: Array<'sandy' | 'loamy' | 'clayey' | 'silty' | 'sandy-loam' | 'clay-loam'>; // acceptable textures
  rootingDepth?: 'shallow' | 'medium' | 'deep';
  notes?: string;
  seasonality?: Array<'jan'|'feb'|'mar'|'apr'|'may'|'jun'|'jul'|'aug'|'sep'|'oct'|'nov'|'dec'>; // typical sowing months (northern hemisphere generalized)
}

export const cropLibrary: CropRequirements[] = [
  {
    id: 'wheat',
    names: { english: 'Wheat', hindi: 'गेहूं' },
    temperatureRange: [10, 25],
    rainfallRange: [20, 60],
    phRange: [6.0, 7.5],
    texture: ['loamy', 'clay-loam'],
    rootingDepth: 'medium',
    seasonality: ['nov','dec','jan'],
    notes: 'Prefers cool growing conditions; moderate water needs.'
  },
  {
    id: 'rice',
    names: { english: 'Rice', hindi: 'चावल' },
    temperatureRange: [20, 32],
    rainfallRange: [60, 150],
    phRange: [5.5, 7.0],
    texture: ['clayey', 'clay-loam', 'silty'],
    rootingDepth: 'medium',
    seasonality: ['jun','jul','aug'],
    notes: 'High water requirement; tolerant of flooding.'
  },
  {
    id: 'maize',
    names: { english: 'Maize', hindi: 'मक्का' },
    temperatureRange: [15, 30],
    rainfallRange: [40, 100],
    phRange: [5.8, 7.2],
    texture: ['loamy', 'sandy-loam'],
    rootingDepth: 'deep',
    seasonality: ['jun','jul'],
    notes: 'Requires well-drained soils; sensitive to waterlogging.'
  },
  {
    id: 'soybean',
    names: { english: 'Soybean', hindi: 'सोयाबीन' },
    temperatureRange: [24, 32],
    rainfallRange: [40, 120],
    phRange: [6.0, 7.5],
    texture: ['loamy', 'sandy-loam', 'clay-loam'],
    rootingDepth: 'medium',
    seasonality: ['jun','jul','aug','sep'],
    notes: 'Widely grown in Madhya Pradesh during Kharif; fits local monsoon climate.'
  },
  {
    id: 'chickpea',
    names: { english: 'Chickpea', hindi: 'चना' },
    temperatureRange: [10, 28],
    rainfallRange: [20, 50],
    phRange: [6.0, 8.0],
    texture: ['sandy-loam', 'loamy'],
    rootingDepth: 'deep',
    seasonality: ['nov','dec'],
    notes: 'Drought tolerant legume.'
  }
];
