import L from 'leaflet';
import { THEME_COLORS, SEVERITY_PIN_COLORS } from '../../lib/theme';

/**
 * Teardrop pin icon colored by severity with a dark-ink border and white dot.
 */
export const incidentIcon = (severity = 'medium') => {
  const color = SEVERITY_PIN_COLORS[severity] || SEVERITY_PIN_COLORS.medium;
  const inkBorder = THEME_COLORS.ink.DEFAULT;

  const html = `
    <div style="position: relative; width: 30px; height: 42px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 4px 6px rgba(43,47,69,0.25));">
      <svg width="30" height="42" viewBox="0 0 30 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 41C15 41 28 27.5 28 15C28 7.8203 22.1797 2 15 2C7.8203 2 2 7.8203 2 15C2 27.5 15 41 15 41Z" fill="${color.bg}" stroke="${inkBorder}" stroke-width="2.5" stroke-linejoin="round"/>
        <circle cx="15" cy="15" r="4.5" fill="#FFFFFF" stroke="${inkBorder}" stroke-width="1.5"/>
      </svg>
    </div>
  `;

  return L.divIcon({
    className: 'custom-incident-pin',
    html,
    iconSize: [30, 42],
    iconAnchor: [15, 41],
    popupAnchor: [0, -38],
  });
};

/**
 * Responder live location marker with pulse ring and navigation arrow.
 */
export const responderIcon = (isSelected = false) => {
  const primaryColor = isSelected ? '#3B49DF' : THEME_COLORS.primary[600];
  const pulseColor = isSelected ? 'rgba(59, 73, 223, 0.4)' : THEME_COLORS.primary[200];
  const size = isSelected ? 42 : 36;
  const innerSize = isSelected ? 30 : 26;
  const strokeColor = isSelected ? '#FDE047' : '#FFFFFF'; // gold ring when selected

  const html = `
    <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center;">
      <div class="animate-marker-pulse" style="position: absolute; width: ${size}px; height: ${size}px; border-radius: 50%; background-color: ${pulseColor}; pointer-events: none;"></div>
      <div style="position: relative; width: ${innerSize}px; height: ${innerSize}px; border-radius: 50%; background-color: ${primaryColor}; border: 3px solid ${strokeColor}; box-shadow: 0 3px 10px rgba(59,73,223,0.5); display: flex; align-items: center; justify-content: center;">
        <svg width="${isSelected ? 16 : 14}" height="${isSelected ? 16 : 14}" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="3 11 22 2 13 21 11 13 3 11"/>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    className: `custom-responder-pin ${isSelected ? 'is-selected' : ''}`,
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

/**
 * User's own location dot (blue-ish dot with white ring and faint shadow).
 */
export const myLocationIcon = () => {
  const color = THEME_COLORS.primary[500];

  const html = `
    <div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 22px; height: 22px; border-radius: 50%; background-color: rgba(111, 126, 234, 0.25);"></div>
      <div style="position: relative; width: 14px; height: 14px; border-radius: 50%; background-color: ${color}; border: 2.5px solid #FFFFFF; box-shadow: 0 1px 5px rgba(0,0,0,0.3);"></div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-my-location-pin',
    html,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  });
};
