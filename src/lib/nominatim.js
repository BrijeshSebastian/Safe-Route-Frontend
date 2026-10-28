const searchCache = new Map();
const reverseCache = new Map();

let lastRequestTime = 0;
const MIN_INTERVAL_MS = 1000;

async function throttle() {
  const now = Date.now();
  const timeSinceLast = now - lastRequestTime;
  if (timeSinceLast < MIN_INTERVAL_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_INTERVAL_MS - timeSinceLast));
  }
  lastRequestTime = Date.now();
}

/**
 * Searches places/addresses using OpenStreetMap Nominatim.
 * Throttled to max 1 req/sec, cached in memory, supports AbortSignal.
 */
export async function searchAddress(query, signal = null) {
  const trimmed = (query || '').trim();
  if (trimmed.length < 3) return [];

  const cacheKey = trimmed.toLowerCase();
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey);
  }

  try {
    await throttle();
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
      trimmed
    )}&limit=5&addressdetails=1&accept-language=en`;

    const res = await fetch(url, {
      signal,
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    if (Array.isArray(data)) {
      searchCache.set(cacheKey, data);
      return data;
    }
    return [];
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    return [];
  }
}

/**
 * Reverse geocodes coordinates into an address string.
 */
export async function reverseGeocode(lat, lon, signal = null) {
  if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) {
    return null;
  }

  const roundedLat = Number(lat).toFixed(6);
  const roundedLon = Number(lon).toFixed(6);
  const cacheKey = `${roundedLat},${roundedLon}`;

  if (reverseCache.has(cacheKey)) {
    return reverseCache.get(cacheKey);
  }

  try {
    await throttle();
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${roundedLat}&lon=${roundedLon}&accept-language=en`;

    const res = await fetch(url, {
      signal,
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    const address = data?.display_name || null;
    if (address) {
      reverseCache.set(cacheKey, address);
    }
    return address;
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    return null;
  }
}
