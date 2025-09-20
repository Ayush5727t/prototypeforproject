// Types for structured combined weather output
export interface DailyForecast {
  date: string;          // ISO date
  maxTemp: number;
  minTemp: number;
  avgHumidity: number;
  totalPrecipMm: number;
  description: string;
}

export interface WeatherAlertGenerated {
  id: string;
  type: 'warning' | 'info' | 'danger';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string; // ISO
}

export interface CombinedWeatherData {
  current: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    precipitationLastHour: number;
  };
  daily: DailyForecast[]; // 7 day
  alerts: WeatherAlertGenerated[];
  raw: {
    openMeteo?: any;
    metNo?: any;
  };
}

// Helper: aggregate by day from hourly arrays
function aggregateDaily(timeArr: string[], values: Record<string, number[]>) {
  const byDate: Record<string, any> = {};
  timeArr.forEach((ts, idx) => {
    const date = ts.split('T')[0];
    if (!byDate[date]) {
      byDate[date] = {
        temps: [] as number[],
        humidity: [] as number[],
        precip: [] as number[],
      };
    }
    if (values.temperature_2m) byDate[date].temps.push(values.temperature_2m[idx]);
    if (values.relative_humidity_2m) byDate[date].humidity.push(values.relative_humidity_2m[idx]);
    if (values.precipitation) byDate[date].precip.push(values.precipitation[idx]);
  });
  return Object.entries(byDate).map(([date, v]) => {
    const temps: number[] = v.temps;
    return {
      date,
      maxTemp: temps.length ? Math.max(...temps) : 0,
      minTemp: temps.length ? Math.min(...temps) : 0,
      avgHumidity: v.humidity.length ? Math.round(v.humidity.reduce((a: number,b: number)=>a+b,0)/v.humidity.length) : 0,
      totalPrecipMm: v.precip.reduce((a: number,b: number)=>a+b,0),
    };
  }).sort((a,b)=> a.date.localeCompare(b.date));
}

// Derive simple alerts from daily & current conditions
function generateAlerts(daily: ReturnType<typeof aggregateDaily>, current: CombinedWeatherData['current']): WeatherAlertGenerated[] {
  const alerts: WeatherAlertGenerated[] = [];
  const now = new Date().toISOString();
  // Heavy rain upcoming
  const heavyRain = daily.find(d => d.totalPrecipMm >= 20);
  if (heavyRain) {
    alerts.push({
      id: 'rain-'+heavyRain.date,
      type: 'warning',
      title: 'Heavy Rain Forecast',
      message: `Expected ≥ ${heavyRain.totalPrecipMm.toFixed(1)} mm on ${heavyRain.date}`,
      severity: heavyRain.totalPrecipMm > 40 ? 'high' : 'medium',
      timestamp: now
    });
  }
  // Heat alert
  const hot = daily.find(d => d.maxTemp >= 38);
  if (hot) {
    alerts.push({
      id: 'heat-'+hot.date,
      type: 'warning',
      title: 'High Temperature Alert',
      message: `Max temperature reaching ${hot.maxTemp.toFixed(1)}°C on ${hot.date}`,
      severity: hot.maxTemp >= 42 ? 'high' : 'medium',
      timestamp: now
    });
  }
  // Low humidity or dryness advisory
  const dry = daily.find(d => d.avgHumidity <= 25);
  if (dry) {
    alerts.push({
      id: 'dry-'+dry.date,
      type: 'info',
      title: 'Low Humidity Advisory',
      message: `Average humidity around ${dry.avgHumidity}% on ${dry.date}`,
      severity: 'low',
      timestamp: now
    });
  }
  // Current heavy precipitation
  if (current.precipitationLastHour >= 5) {
    alerts.push({
      id: 'current-rain',
      type: 'danger',
      title: 'Intense Rainfall Ongoing',
      message: `~${current.precipitationLastHour.toFixed(1)} mm in last hour`,
      severity: 'high',
      timestamp: now
    });
  }
  return alerts;
}

// Fetch MET Norway compact forecast
async function fetchMetNo(lat: number, lon: number) {
  const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`;
  console.log('🌍 MET Norway: Fetching', url);
  const resp = await fetch(url, { headers: { 'User-Agent': 'sampr-crop-app/1.0 support@example.com' }});
  if (!resp.ok) throw new Error(`MET Norway API failed: ${resp.status}`);
  const data = await resp.json();
  return data;
}

// Fetch Open-Meteo base forecast
async function fetchOpenMeteo(lat: number, lon: number) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,relative_humidity_2m&current_weather=true&past_days=1&timezone=auto`;
  console.log('🌤️ OpenMeteo: Fetching weather data for coordinates:', { lat, lon });
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Open-Meteo API request failed: ${response.status}`);
  return response.json();
}

// Public function combining both providers
export async function getWeatherData(lat: number, lon: number): Promise<CombinedWeatherData> {
  try {
    const [openMeteo, metNo] = await Promise.all([
      fetchOpenMeteo(lat, lon),
      fetchMetNo(lat, lon).catch(err => { console.warn('MET Norway fetch failed, continuing without it', err); return null; })
    ]);

    // Extract current conditions (prefer MET for wind if available)
    let currentPrecip = 0;
    // MET compact timeseries first entry precipitation (if available)
    if (metNo?.properties?.timeseries?.length) {
      const first = metNo.properties.timeseries[0];
      const details = first.data?.next_1_hours?.details;
      currentPrecip = details?.precipitation_amount ?? 0;
    }

    const current = {
      temperature: openMeteo.current_weather?.temperature ?? 0,
      humidity: openMeteo.hourly?.relative_humidity_2m?.[openMeteo.hourly.relative_humidity_2m.length -1] ?? 0,
      windSpeed: openMeteo.current_weather?.windspeed ?? 0,
      precipitationLastHour: currentPrecip
    };

    // Aggregate daily from Open-Meteo hourly arrays
    let dailyAgg: ReturnType<typeof aggregateDaily> = [];
    if (openMeteo.hourly?.time) {
      dailyAgg = aggregateDaily(openMeteo.hourly.time, {
        temperature_2m: openMeteo.hourly.temperature_2m,
        relative_humidity_2m: openMeteo.hourly.relative_humidity_2m,
        precipitation: openMeteo.hourly.precipitation
      });
    }

    // Build forecast descriptions using simple heuristics
    const daily: DailyForecast[] = dailyAgg.slice(0,7).map(d => ({
      date: d.date,
      maxTemp: d.maxTemp,
      minTemp: d.minTemp,
      avgHumidity: d.avgHumidity,
      totalPrecipMm: Math.round(d.totalPrecipMm * 10)/10,
      description: d.totalPrecipMm > 5 ? 'Rain likely' : (d.maxTemp > 35 ? 'Hot & Dry' : 'Fair')
    }));

    // Merge MET Norway official alerts with generated alerts
  const allAlerts = generateAlerts(dailyAgg.slice(0,7), current);

    const combined: CombinedWeatherData = {
      current,
      daily,
      alerts: allAlerts,
      raw: { openMeteo, metNo }
    };
    console.log('🌐 Combined weather data generated:', combined);
    return combined;
  } catch (err) {
    console.error('❌ getWeatherData combined fetch failed', err);
    throw err;
  }
}
