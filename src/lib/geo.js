/**
 * Safely converts string/number coordinate or metric to finite Number or null.
 */
export function toNumber(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Validates whether latitude and longitude are valid geographic coordinates.
 */
export function isValidCoord(lat, lng) {
  const nLat = toNumber(lat);
  const nLng = toNumber(lng);
  if (nLat === null || nLng === null) return false;
  return nLat >= -90 && nLat <= 90 && nLng >= -180 && nLng <= 180;
}

/**
 * Computes great-circle distance between two coordinate pairs in kilometers.
 */
export function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const p1 = toNumber(lat1);
  const l1 = toNumber(lon1);
  const p2 = toNumber(lat2);
  const l2 = toNumber(lon2);
  if (p1 === null || l1 === null || p2 === null || l2 === null) return null;

  const R = 6371; // Earth's mean radius in km
  const dLat = ((p2 - p1) * Math.PI) / 180;
  const dLon = ((l2 - l1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1 * Math.PI) / 180) *
      Math.cos((p2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Fallback center map view when user geolocation is denied or unavailable.
 */
export const FALLBACK_CENTER = Object.freeze({
  lat: 20.5937,
  lng: 78.9629,
  zoom: 5,
});
