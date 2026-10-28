import { describe, it, expect } from 'vitest';
import { googleMapsDirectionsUrl, googleMapsPinUrl, osmTileConfig } from '../lib/maps';

describe('maps utilities', () => {
  it('generates exact Google Maps driving directions URL for numbers', () => {
    const url = googleMapsDirectionsUrl(12.9716, 77.5946);
    expect(url).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=12.9716,77.5946&travelmode=driving'
    );
  });

  it('generates exact Google Maps driving directions URL for string coordinates', () => {
    const url = googleMapsDirectionsUrl('12.9716', '77.5946');
    expect(url).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=12.9716,77.5946&travelmode=driving'
    );
  });

  it('returns empty string if coordinates are invalid', () => {
    expect(googleMapsDirectionsUrl(null, 77.5946)).toBe('');
    expect(googleMapsDirectionsUrl('abc', 'def')).toBe('');
    expect(googleMapsDirectionsUrl(undefined, undefined)).toBe('');
  });

  it('generates exact Google Maps pin search URL', () => {
    const url = googleMapsPinUrl(12.9716, 77.5946);
    expect(url).toBe('https://www.google.com/maps/search/?api=1&query=12.9716,77.5946');
  });

  it('generates exact Google Maps pin search URL for string coordinates', () => {
    const url = googleMapsPinUrl('12.9716', '77.5946');
    expect(url).toBe('https://www.google.com/maps/search/?api=1&query=12.9716,77.5946');
  });

  it('provides valid osmTileConfig with OpenStreetMap attribution', () => {
    expect(osmTileConfig.url).toContain('tile.openstreetmap.org');
    expect(osmTileConfig.attribution).toContain('OpenStreetMap');
  });
});
