import { toNumber } from './geo';

/**
 * Builds Google Maps driving directions URL.
 * https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>&travelmode=driving
 */
export function googleMapsDirectionsUrl(lat, lng) {
  const nLat = toNumber(lat);
  const nLng = toNumber(lng);
  if (nLat === null || nLng === null) return '';
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(nLat)},${encodeURIComponent(nLng)}&travelmode=driving`;
}

/**
 * Builds Google Maps search/pin URL.
 * https://www.google.com/maps/search/?api=1&query=<lat>,<lng>
 */
export function googleMapsPinUrl(lat, lng) {
  const nLat = toNumber(lat);
  const nLng = toNumber(lng);
  if (nLat === null || nLng === null) return '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nLat)},${encodeURIComponent(nLng)}`;
}

/**
 * Standard OpenStreetMap tile layer configuration with required attribution.
 */
export const osmTileConfig = Object.freeze({
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
  maxZoom: 19,
  minZoom: 1,
});
