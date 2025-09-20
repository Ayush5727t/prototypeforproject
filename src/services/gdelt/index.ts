// GDELT News Alert Service
// Fetches news articles related to agriculture-impacting events (e.g., flood, drought, crop damage)
// and maps them into the existing WeatherAlertGenerated shape for reuse in UI.

export interface GdeltArticle {
  url: string;
  title: string;
  seendate: string; // format: YYYYMMDDHHMMSS
  domain: string;
}

export interface GdeltResponse {
  articles?: GdeltArticle[];
}

export interface NewsAlertItem {
  id: string;
  type: 'warning' | 'info' | 'danger';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string; // ISO
}

// Build a GDELT API URL
function buildGdeltUrl(query: string, max: number = 10): string {
  const base = 'https://api.gdeltproject.org/api/v2/doc/doc';
  const params = new URLSearchParams({
    query,
    mode: 'ArtList',
    maxrecords: String(max),
    format: 'json'
  });
  return `${base}?${params.toString()}`;
}

function parseSeenDate(seendate: string): string {
  if (!seendate || seendate.length < 8) return new Date().toISOString();
  // seendate: YYYYMMDDHHMMSS
  const y = seendate.slice(0,4);
  const m = seendate.slice(4,6);
  const d = seendate.slice(6,8);
  const hh = seendate.slice(8,10) || '00';
  const mm = seendate.slice(10,12) || '00';
  const ss = seendate.slice(12,14) || '00';
  return new Date(`${y}-${m}-${d}T${hh}:${mm}:${ss}Z`).toISOString();
}

export async function fetchNewsAlerts(keywords: string[] = ['flood','drought','crop damage'], maxArticles: number = 10): Promise<NewsAlertItem[]> {
  const query = keywords.map(k => k.replace(/\s+/g, '+')).join('+');
  const url = buildGdeltUrl(query, maxArticles);
  console.log('📰 GDELT: Fetching news alerts:', url);
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      console.warn('📰 GDELT: Request failed', resp.status, resp.statusText);
      return [];
    }
    const data: GdeltResponse = await resp.json();
    const articles = data.articles || [];
    console.log('📰 GDELT: Articles received:', articles.length);
    return articles.map((a, idx) => {
      // Severity heuristic: keywords presence
      const lower = a.title.toLowerCase();
      let severity: 'low' | 'medium' | 'high' = 'low';
      if (/(severe|extreme|disaster|devastating|massive)/.test(lower)) severity = 'high';
      else if (/(alert|warning|damage|loss)/.test(lower)) severity = 'medium';
      return {
        id: `news-${idx}-${a.seendate || a.url}`,
        type: 'warning',
        title: a.title.slice(0,120),
        message: a.url,
        severity,
        timestamp: parseSeenDate(a.seendate)
      };
    });
  } catch (err) {
    console.error('📰 GDELT: Fetch error', err);
    return [];
  }
}
