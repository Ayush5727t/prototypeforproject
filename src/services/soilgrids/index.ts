// SoilGrids API service (legacy, not used for new soil data)
export async function getSoilDataSoilGrids(lat: number, lon: number): Promise<any> {
  const url = `https://rest.isric.org/soilgrids/v2.0/properties/query?lat=${lat}&lon=${lon}`;
  console.log('Fetching soil data from SoilGrids:', url);
  const response = await fetch(url);
  if (!response.ok) {
    console.error('SoilGrids data fetch failed:', response.status, response.statusText);
    throw new Error('Failed to fetch soil data');
  }
  const data = await response.json();
  console.log('SoilGrids API response:', data);
  return data;
}

// Get soil data from SoilGrids API and return main properties for 0-5cm layer (legacy function)
export async function getSoilData(lat: number, lon: number): Promise<{
  sand: number;
  silt: number;
  clay: number;
  soc: number;
  nitrogen: number;
  phh2o: number;
  phosphorus: number;
}> {
  const url = `https://rest.isric.org/soilgrids/v2.0/properties/query?lat=${lat}&lon=${lon}`;
  console.log('Fetching soil data from:', url);
  const response = await fetch(url);
  if (!response.ok) {
    console.error('Soil data fetch failed:', response.status, response.statusText);
    throw new Error('Failed to fetch soil data');
  }
  const data = await response.json();
  console.log('SoilGrids API response:', data);
  // Defensive: check structure
  const feature = data?.features?.[0]?.properties;
  if (!feature) {
    console.error('No soil data found in response:', data);
    throw new Error('No soil data found');
  }
  const getMean = (prop: string) => feature[prop]?.['0-5cm']?.mean ?? null;
  return {
    sand: getMean('sand'),
    silt: getMean('silt'),
    clay: getMean('clay'),
    soc: getMean('soc'),
    nitrogen: getMean('nitrogen'),
    phh2o: getMean('phh2o'),
    phosphorus: getMean('phosphorus'),
  };
}
