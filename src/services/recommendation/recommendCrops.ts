import { cropLibrary, CropRequirements } from './cropLibrary';
import { DailyForecast } from '../openmeteo';

export interface RecommendationInput {
  // soil
  ph?: number | null;
  sand?: number | null;
  silt?: number | null;
  clay?: number | null;
  orgCarbon?: number | null; // soc
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
  seasonality: number;
}

export interface CropRecommendationComputed {
  id: string;
  names: { english: string; hindi: string };
  score: number; // 0-1
  suitability: 'excellent' | 'good' | 'moderate' | 'poor';
  confidence: number; // simple proxy (fraction of factors with non-null data)
  reasons: { english: string[]; hindi: string[] };
  breakdown: CropScoreBreakdown;
}

// Range scoring: 1 inside range; smooth decay (quadratic) outside up to 50% penalty at 25% deviation beyond range, 0 at 50% deviation
export function rangeScore(value: number | null | undefined, [min, max]: [number, number]): number {
  if (value === null || value === undefined || isNaN(value)) return 0;
  if (value >= min && value <= max) return 1;
  const span = max - min;
  if (span <= 0) return 0;
  if (value < min) {
    const d = (min - value) / span; // deviation fractions relative to span
    if (d >= 0.5) return 0;
    return 1 - (d / 0.5) ** 2; // quadratic falloff
  } else { // value > max
    const d = (value - max) / span;
    if (d >= 0.5) return 0;
    return 1 - (d / 0.5) ** 2;
  }
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

function seasonScore(requirements: CropRequirements, now: Date): number {
  if (!requirements.seasonality || requirements.seasonality.length === 0) return 1; // neutral
  const monthIdx = now.getUTCMonth(); // 0-based
  const monthMap = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'] as const;
  const current = monthMap[monthIdx];
  return requirements.seasonality.includes(current) ? 1 : 0.4; // penalize off-season but not zero
}

export function computeWeeklyRainfall(forecast?: DailyForecast[]): number | null {
  if (!forecast || forecast.length === 0) return null;
  // assume forecast has precipitation_sum or rainfall; adapt if not
  const sums: number[] = [];
  for (const d of forecast.slice(0,7)) {
    const p = (d as any).precipitation_sum ?? (d as any).rainfall ?? null;
    if (typeof p === 'number') sums.push(p);
  }
  if (!sums.length) return null;
  return sums.reduce((a,b) => a + b, 0);
}

export function recommendCrops(input: RecommendationInput): CropRecommendationComputed[] {
  const now = input.now || new Date();
  const weeklyRain = computeWeeklyRainfall(input.forecast);
  const texture = classifyTexture(input.sand, input.silt, input.clay);

  const results: CropRecommendationComputed[] = [];

  for (const crop of cropLibrary) {
    const tScore = (() => {
      // approximate avg temperature from forecast by mean of first 7 days mid temps
      if (!input.forecast || input.forecast.length === 0) return 0;
      const temps: number[] = [];
      for (const d of input.forecast.slice(0,7)) {
        if (typeof d.minTemp === 'number' && typeof d.maxTemp === 'number') temps.push((d.minTemp + d.maxTemp)/2);
        else if (typeof (d as any).temperature_mean === 'number') temps.push((d as any).temperature_mean);
      }
      if (!temps.length) return 0;
      const avg = temps.reduce((a,b) => a + b, 0) / temps.length;
      return rangeScore(avg, crop.temperatureRange);
    })();

    const rScore = rangeScore(weeklyRain, crop.rainfallRange);
    const phScore = rangeScore(input.ph ?? null, crop.phRange);
    const texScore = (() => {
      if (!texture) return 0;
      return crop.texture.includes(texture as any) ? 1 : 0.3; // partial penalty for mismatch
    })();
    const seasScore = seasonScore(crop, now);

    // Weighted aggregation
    const breakdown: CropScoreBreakdown = {
      temperature: tScore,
      rainfall: rScore,
      ph: phScore,
      texture: texScore,
      seasonality: seasScore
    };

    const weights = { temperature: 0.28, rainfall: 0.25, ph: 0.18, texture: 0.14, seasonality: 0.15 };
    const score = Object.entries(breakdown).reduce((acc, [k,v]) => acc + v * (weights as any)[k], 0);

    const presentFactors = [tScore, rScore, phScore, texScore, seasScore].filter(v => v > 0).length;
    const confidence = presentFactors / 5; // simple proportion

    const suitability: CropRecommendationComputed['suitability'] = score >= 0.8 ? 'excellent' : score >= 0.6 ? 'good' : score >= 0.4 ? 'moderate' : 'poor';

    const reasonsEn: string[] = [];
    const reasonsHi: string[] = [];

    if (tScore >= 0.8) { reasonsEn.push('Temperature is within optimal range'); reasonsHi.push('तापमान आदर्श सीमा में है'); }
    else if (tScore >= 0.5) { reasonsEn.push('Temperature is acceptable'); reasonsHi.push('तापमान स्वीकार्य है'); }
    else { reasonsEn.push('Temperature outside ideal range'); reasonsHi.push('तापमान आदर्श सीमा से बाहर है'); }

    if (rScore >= 0.8) { reasonsEn.push('Expected rainfall suits this crop'); reasonsHi.push('अनुमानित वर्षा इस फसल के अनुकूल है'); }
    else if (rScore >= 0.5) { reasonsEn.push('Rainfall partly suitable'); reasonsHi.push('वर्षा आंशिक रूप से उपयुक्त'); }
    else { reasonsEn.push('Rainfall may be insufficient/excess'); reasonsHi.push('वर्षा अपर्याप्त या अधिक हो सकती है'); }

    if (phScore >= 0.8) { reasonsEn.push('Soil pH is optimal'); reasonsHi.push('मिट्टी का pH आदर्श है'); }
    else if (phScore >= 0.5) { reasonsEn.push('Soil pH is acceptable'); reasonsHi.push('मिट्टी का pH स्वीकार्य है'); }
    else { reasonsEn.push('Soil pH outside ideal range'); reasonsHi.push('मिट्टी का pH आदर्श सीमा से बाहर'); }

    if (texScore >= 0.9) { reasonsEn.push('Soil texture matches crop preference'); reasonsHi.push('मिट्टी की बनावट फसल के अनुरूप'); }
    else if (texScore >= 0.3) { reasonsEn.push('Soil texture partially suitable'); reasonsHi.push('मिट्टी की बनावट आंशिक रूप से उपयुक्त'); }
    else { reasonsEn.push('Soil texture not ideal'); reasonsHi.push('मिट्टी की बनावट उपयुक्त नहीं'); }

    if (seasScore >= 0.9) { reasonsEn.push('Current month aligns with sowing season'); reasonsHi.push('वर्तमान माह बुवाई मौसम से मेल खाता'); }
    else { reasonsEn.push('Off typical sowing season'); reasonsHi.push('सामान्य बुवाई मौसम से बाहर'); }

    results.push({
      id: crop.id,
      names: crop.names,
      score: Math.round(score * 1000)/1000,
      suitability,
      confidence: Math.round(confidence * 1000)/1000,
      reasons: { english: reasonsEn, hindi: reasonsHi },
      breakdown
    });
  }

  // Sort by score desc
  return results.sort((a,b) => b.score - a.score);
}
