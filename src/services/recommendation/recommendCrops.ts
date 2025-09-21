import { cropLibrary } from './cropLibrary';
import { DailyForecast } from '../openmeteo';

export interface RecommendationInput {
  // soil
  ph?: number | null;
  sand?: number | null;
  silt?: number | null;
  clay?: number | null;
  orgCarbon?: number | null; // soil organic carbon
  // weather
  forecast?: DailyForecast[]; // from context
  rainfallLast24h?: number;
  // meta
  now?: Date;
}

export interface CropScoreBreakdown {
  temperature: number;
  rainfall: number;
  ph: number;
  texture: number;
  season: number;
  soc?: number;
  humidity?: number;
  anomalies?: number;
}

export interface CropRecommendationComputed {
  id: string;
  names: { english: string; hindi: string };
  overallScore: number; // 0-1 aggregated adaptive score
  confidence: number; // 0-100 scaled
  suitability: 'excellent' | 'good' | 'moderate' | 'poor';
  reasons: { english: string[]; hindi: string[] };
  factorScores: CropScoreBreakdown;
  limitingFactors: string[];
  meta: {
    weeklyRainfall: number | null;
    temperatureSampleCount: number;
    agroSeason: 'kharif' | 'rabi' | 'zaid';
    texture: string | null;
    completeness: number;
  };
  debug?: Record<string, any>;
}

// Legacy simple range score retained for pH usage
export function rangeScore(value: number | null | undefined, [min, max]: [number, number]): number {
  if (value === null || value === undefined || isNaN(value)) return 0;
  if (value >= min && value <= max) return 1;
  const span = max - min;
  if (span <= 0) return 0;
  if (value < min) {
    const d = (min - value) / span;
    if (d >= 0.5) return 0;
    return 1 - (d / 0.5) ** 2;
  } else {
    const d = (value - max) / span;
    if (d >= 0.5) return 0;
    return 1 - (d / 0.5) ** 2;
  }
}

// Trapezoidal suitability (a,b plateau start; c plateau end; d) returns 0..1
function trapezoidScore(value: number | undefined | null, a: number, b: number, c: number, d: number): number {
  if (value == null || isNaN(value)) return 0;
  if (value <= a || value >= d) return 0;
  if (value >= b && value <= c) return 1;
  if (value > a && value < b) return (value - a) / (b - a);
  return (d - value) / (d - c);
}

function gaussianScore(value: number | undefined | null, center: number, idealHalfWidth: number, sigmaFactor = 1.8): number {
  if (value == null || isNaN(value)) return 0;
  const sigma = idealHalfWidth / sigmaFactor;
  const exponent = -Math.pow(value - center, 2) / (2 * sigma * sigma);
  return Math.max(0, Math.min(1, Math.exp(exponent)));
}

function softSeasonScore(inSeason: boolean, inSowingWindow: boolean, monthDistance: number): number {
  if (inSeason && inSowingWindow) return 1;
  if (inSeason && !inSowingWindow) return 0.75;
  const decay = Math.max(0, 1 - (monthDistance / 4));
  return 0.4 * decay;
}

function adaptiveWeight(base: number, score: number): number {
  if (score >= 0.85) return base * 0.8; // damp near perfect
  if (score <= 0.4) return base * 1.25; // emphasize weak
  return base;
}

// Simple soil texture classification (approx): returns primary bucket plus combos
export function classifyTexture(sand?: number | null, silt?: number | null, clay?: number | null): string | null {
  if ([sand, silt, clay].some(v => v === null || v === undefined)) return null;
  // Normalize (some APIs already percent). Assume they are percentages.
  const total = (sand || 0) + (silt || 0) + (clay || 0);
  if (total <= 0) return null;
  const s = (sand || 0) / total * 100;
  const si = (silt || 0) / total * 100;
  const c = (clay || 0) / total * 100;
  // Basic rules (simplified)
  if (c > 40) return 'clayey';
  if (s > 70 && c < 15) return 'sandy';
  if (si > 70 && c < 15) return 'silty';
  if (s > 45 && c > 20 && c < 35) return 'sandy-loam';
  if (c > 27 && c < 40 && si > 15 && si < 53) return 'clay-loam';
  return 'loamy';
}

function basicMonthMap() { return ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'] as const; }
function monthName(now: Date) { return basicMonthMap()[ now.getUTCMonth() ]; }

// Derive broad Indian agro season from month (can be regionalized later)
export function deriveAgroSeason(d: Date): 'kharif' | 'rabi' | 'zaid' {
  const m = d.getUTCMonth()+1; // 1-12
  // Rough grouping: Kharif (Jun-Oct), Rabi (Nov-Mar), Zaid (Apr-May, also mid-summer gap)
  if (m >= 6 && m <= 10) return 'kharif';
  if (m === 4 || m === 5) return 'zaid';
  return 'rabi';
}

export function computeWeeklyRainfall(forecast?: DailyForecast[]): number | null {
  if (!forecast || forecast.length === 0) return null;
  const days = forecast.slice(0,7);
  const vals: number[] = [];
  for (const d of days) {
    // Our DailyForecast interface exposes totalPrecipMm
    if (typeof (d as any).totalPrecipMm === 'number') vals.push((d as any).totalPrecipMm);
    else {
      const fallback = (d as any).precipitation_sum ?? (d as any).rainfall;
      if (typeof fallback === 'number') vals.push(fallback);
    }
  }
  if (!vals.length) return null;
  return vals.reduce((a,b)=>a+b,0);
}

export function recommendCrops(input: RecommendationInput, topN = 5, options?: { debug?: boolean }): CropRecommendationComputed[] {
  const now = input.now || new Date();
  const weeklyRainfall = computeWeeklyRainfall(input.forecast);
  const texture = classifyTexture(input.sand, input.silt, input.clay);
  const agroSeason = deriveAgroSeason(now);
  const monthStr = monthName(now);

  const results: CropRecommendationComputed[] = [];

  for (const crop of cropLibrary) {
    const limiting: string[] = [];
    const reasonsEn: string[] = [];
    const reasonsHi: string[] = [];
    const debug: Record<string, any> = {};

    // --- Temperature (Gaussian) ---
    let temperatureScore = 0;
    let avgTemp: number | null = null;
    if (input.forecast && input.forecast.length) {
      const temps: number[] = [];
      for (const d of input.forecast.slice(0,7)) {
        if (typeof d.minTemp === 'number' && typeof d.maxTemp === 'number') temps.push((d.minTemp + d.maxTemp)/2);
        else if (typeof (d as any).temperature_mean === 'number') temps.push((d as any).temperature_mean);
      }
      if (temps.length) {
        avgTemp = temps.reduce((a,b)=>a+b,0)/temps.length;
        const mid = (crop.temperatureRange[0] + crop.temperatureRange[1]) / 2;
        const half = (crop.temperatureRange[1] - crop.temperatureRange[0]) / 2;
        temperatureScore = gaussianScore(avgTemp, mid, half);
        if (avgTemp < crop.temperatureRange[0]-5 || avgTemp > crop.temperatureRange[1]+5) {
          limiting.push('Temperature outside tolerance');
        } else if (temperatureScore < 0.5) {
          limiting.push('Temperature suboptimal');
        }
      } else {
        limiting.push('Temperature unknown');
      }
    } else {
      limiting.push('Temperature unknown');
    }

    // --- Rainfall (Trapezoid) ---
    let rainfallScore = 0;
    if (weeklyRainfall != null) {
      const [rMin, rMax] = crop.rainfallRange;
      const a = rMin * 0.5; // 50% of min start zero
      const b = rMin;       // start plateau
      const c = rMax;       // end plateau
      const d = rMax * 1.4; // 40% above max zero again
      rainfallScore = trapezoidScore(weeklyRainfall, a, b, c, d);
      if (rainfallScore < 0.55) {
        if (weeklyRainfall < rMin) limiting.push('Low rainfall');
        else if (weeklyRainfall > rMax) {
          const excessPct = (weeklyRainfall - rMax) / rMax;
            if (excessPct < 0.15) limiting.push('Slight excess rainfall');
            else limiting.push('Excess rainfall');
        } else limiting.push('Rainfall variability');
      }
    } else {
      limiting.push('Rainfall unknown');
    }

    // --- pH ---
    const phScore = rangeScore(input.ph ?? null, crop.phRange);
    if (phScore === 0) limiting.push('pH unsuitable');
    else if (phScore < 0.5) limiting.push('pH marginal');

    // --- SOC (optional heuristic) ---
    let socScore: number | undefined = undefined;
    if (input.orgCarbon != null) {
      // heuristics: assume desirable if >0.5 for most field crops
      const soc = input.orgCarbon;
      if (soc >= 0.5) socScore = 1; else if (soc > 0.25) socScore = soc / 0.5; else { socScore = soc / 0.5; limiting.push('Low organic carbon'); }
    }

    // --- Texture ---
    let textureScore = 0.4; // mild neutral if unknown
    if (!texture) limiting.push('Texture unknown');
    else if (crop.texture.includes(texture as any)) textureScore = 1; else textureScore = 0.3;
    if (textureScore < 0.5 && texture) limiting.push('Texture mismatch');

    // --- Season & sowing window ---
    const sowingMonths = crop.seasonality || [];
    const inSowing = sowingMonths.includes(monthStr as any);
    const inSeason = inSowing; // (simplified: using same array)
    let monthDistance = 0;
    if (!inSowing && sowingMonths.length) {
      const cur = now.getUTCMonth()+1;
      monthDistance = Math.min(...sowingMonths.map(mName => {
        const idx = basicMonthMap().indexOf(mName as any)+1;
        const diff = Math.abs(idx - cur);
        return Math.min(diff, 12-diff);
      }));
    }
    const seasonScore = softSeasonScore(inSeason, inSowing, monthDistance);
    if (seasonScore < 0.7) limiting.push('Outside ideal sowing window');

    // --- Combine & adaptive weights ---
    let weights = {
      temperature: 0.2,
      rainfall: 0.2,
      ph: 0.15,
      texture: 0.12,
      season: 0.15,
      soc: socScore != null ? 0.08 : 0,
      anomalies: 0.08,
      humidity: 0 // reserved
    };

    weights.temperature = adaptiveWeight(weights.temperature, temperatureScore);
    weights.rainfall = adaptiveWeight(weights.rainfall, rainfallScore);
    weights.ph = adaptiveWeight(weights.ph, phScore);
    weights.texture = adaptiveWeight(weights.texture, textureScore);
    weights.season = adaptiveWeight(weights.season, seasonScore);
    if (socScore != null) weights.soc = adaptiveWeight(weights.soc, socScore);

    const weightSum = Object.values(weights).reduce((a,b)=>a+b,0);
    Object.keys(weights).forEach(k => { (weights as any)[k] = (weights as any)[k] / weightSum; });

    const overall =
      temperatureScore * weights.temperature +
      rainfallScore * weights.rainfall +
      phScore * weights.ph +
      textureScore * weights.texture +
      seasonScore * weights.season +
      (socScore ?? 1) * (weights.soc || 0);

    // Data completeness (core: temp, rain, ph, texture, season, soc?)
    const coreFactorsPresence = [temperatureScore>0, rainfallScore>0, phScore>0, textureScore>0, seasonScore>0, (socScore==null?true:socScore>0)];
    const completeness = coreFactorsPresence.filter(Boolean).length / coreFactorsPresence.length;

    const hardFails = limiting.filter(l => /outside tolerance|unsuitable/i.test(l)).length;
    const penalty = Math.max(0.65, 1 - hardFails * 0.15 - (limiting.length - hardFails) * 0.05);
    const confidence = overall * (0.6 + 0.4 * completeness) * penalty;

    // Suitability buckets
    const suitability: CropRecommendationComputed['suitability'] = overall >= 0.8 ? 'excellent' : overall >= 0.6 ? 'good' : overall >= 0.4 ? 'moderate' : 'poor';

    // Reasons (English/Hindi)
    if (temperatureScore >= 0.8) { reasonsEn.push('Temperature near ideal'); reasonsHi.push('तापमान लगभग आदर्श'); }
    else if (temperatureScore >= 0.5) { reasonsEn.push('Temperature acceptable'); reasonsHi.push('तापमान स्वीकार्य'); }
    else { reasonsEn.push('Temperature limiting'); reasonsHi.push('तापमान सीमित कारक'); }

    if (rainfallScore >= 0.8) { reasonsEn.push('Rainfall within comfortable band'); reasonsHi.push('वर्षा उपयुक्त सीमा में'); }
    else if (rainfallScore >= 0.55) { reasonsEn.push('Rainfall marginally acceptable'); reasonsHi.push('वर्षा सीमांत रूप से स्वीकार्य'); }
    else {
      if (weeklyRainfall != null) {
        const [rMin, rMax] = crop.rainfallRange;
        if (weeklyRainfall < rMin) { reasonsEn.push('Rainfall likely insufficient'); reasonsHi.push('वर्षा संभवतः अपर्याप्त'); }
        else if (weeklyRainfall > rMax) {
          const excessPct = (weeklyRainfall - rMax)/rMax;
          if (excessPct < 0.15) { reasonsEn.push('Slight rainfall excess'); reasonsHi.push('वर्षा थोड़ी अधिक'); }
          else { reasonsEn.push('Excess rainfall risk'); reasonsHi.push('अधिक वर्षा का जोखिम'); }
        }
      } else { reasonsEn.push('Rainfall data missing'); reasonsHi.push('वर्षा डेटा अनुपलब्ध'); }
    }

    if (phScore >= 0.8) { reasonsEn.push('Soil pH optimal'); reasonsHi.push('मिट्टी का pH आदर्श'); }
    else if (phScore >= 0.5) { reasonsEn.push('Soil pH acceptable'); reasonsHi.push('मिट्टी का pH स्वीकार्य'); }
    else { reasonsEn.push('Soil pH limiting'); reasonsHi.push('मिट्टी का pH सीमित'); }

    if (textureScore >= 0.9) { reasonsEn.push('Texture well-suited'); reasonsHi.push('बनावट उपयुक्त'); }
    else if (textureScore >= 0.5) { reasonsEn.push('Texture partially suitable'); reasonsHi.push('बनावट आंशिक रूप से उपयुक्त'); }
    else { reasonsEn.push('Texture mismatch'); reasonsHi.push('बनावट मेल नहीं खाती'); }

    if (seasonScore >= 0.85) { reasonsEn.push('Within sowing window'); reasonsHi.push('बुवाई समय के भीतर'); }
    else if (seasonScore >= 0.6) { reasonsEn.push('Near sowing window'); reasonsHi.push('बुवाई समय के निकट'); }
    else { reasonsEn.push('Outside typical sowing period'); reasonsHi.push('सामान्य बुवाई अवधि से बाहर'); }

    reasonsEn.push(`Agro season: ${agroSeason}`);
    reasonsHi.push(`कृषि मौसम: ${agroSeason === 'kharif' ? 'खरीफ' : agroSeason === 'rabi' ? 'रबी' : 'ज़ैद'}`);

    if (options?.debug) {
      debug.temperatureScore = temperatureScore;
      debug.rainfallScore = rainfallScore;
      debug.phScore = phScore;
      debug.textureScore = textureScore;
      debug.seasonScore = seasonScore;
      debug.weights = weights;
      debug.overall = overall;
      debug.completeness = completeness;
      debug.penalty = penalty;
      debug.avgTemp = avgTemp;
      debug.weeklyRainfall = weeklyRainfall;
    }

    const factorScores: CropScoreBreakdown = {
      temperature: Number(temperatureScore.toFixed(2)),
      rainfall: Number(rainfallScore.toFixed(2)),
      ph: Number(phScore.toFixed(2)),
      texture: Number(textureScore.toFixed(2)),
      season: Number(seasonScore.toFixed(2)),
      soc: socScore != null ? Number(socScore.toFixed(2)) : undefined
    };

    results.push({
      id: crop.id,
      names: crop.names,
      overallScore: Number(overall.toFixed(3)),
      confidence: Number((confidence * 100).toFixed(1)),
      suitability,
      reasons: { english: reasonsEn, hindi: reasonsHi },
      factorScores,
      limitingFactors: limiting,
      meta: {
        weeklyRainfall: weeklyRainfall,
        temperatureSampleCount: input.forecast ? Math.min(7, input.forecast.length) : 0,
        agroSeason,
        texture,
        completeness: Number(completeness.toFixed(2))
      },
      debug: options?.debug ? debug : undefined
    });
  }

  return results.sort((a,b)=> b.overallScore - a.overallScore).slice(0, topN);
}
