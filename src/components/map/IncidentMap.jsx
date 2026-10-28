import React, { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import MapView, { FitBounds } from './MapView';
import { incidentIcon, responderIcon, myLocationIcon } from './markers';
import { toNumber, isValidCoord, FALLBACK_CENTER } from '../../lib/geo';
import { timeAgo } from '../../lib/format';

export const IncidentMap = ({
  incident = null,
  responder = null,
  viewer = null,
  height = 'h-72 md:h-96',
  className = '',
}) => {
  const incLat = toNumber(incident?.latitude);
  const incLng = toNumber(incident?.longitude);
  const hasIncident = incLat !== null && incLng !== null && isValidCoord(incLat, incLng);

  const respLat = toNumber(responder?.latitude);
  const respLng = toNumber(responder?.longitude);
  const hasResponder = respLat !== null && respLng !== null && isValidCoord(respLat, respLng);

  const viewLat = toNumber(viewer?.latitude);
  const viewLng = toNumber(viewer?.longitude);
  const hasViewer = viewLat !== null && viewLng !== null && isValidCoord(viewLat, viewLng);

  const points = useMemo(() => {
    const list = [];
    if (hasIncident) list.push([incLat, incLng]);
    if (hasResponder) list.push([respLat, respLng]);
    if (hasViewer) list.push([viewLat, viewLng]);
    return list;
  }, [hasIncident, incLat, incLng, hasResponder, respLat, respLng, hasViewer, viewLat, viewLng]);

  const center = points.length > 0 ? points[0] : [FALLBACK_CENTER.lat, FALLBACK_CENTER.lng];

  const incIcon = useMemo(() => incidentIcon(incident?.severity), [incident?.severity]);
  const respIcon = useMemo(() => responderIcon(), []);
  const myIcon = useMemo(() => myLocationIcon(), []);

  return (
    <MapView center={center} zoom={15} height={height} className={className}>
      <FitBounds points={points} padding={[40, 40]} maxZoom={16} />

      {/* Incident Marker */}
      {hasIncident && (
        <Marker position={[incLat, incLng]} icon={incIcon}>
          <Popup className="custom-incident-popup">
            <div className="p-1 space-y-1 max-w-[200px]">
              <h4 className="font-semibold text-xs text-ink line-clamp-2">
                {incident.title || 'Emergency Incident'}
              </h4>
              {incident.address && (
                <p className="text-[11px] text-ink-soft line-clamp-2">{incident.address}</p>
              )}
            </div>
          </Popup>
        </Marker>
      )}

      {/* Responder Live Marker */}
      {hasResponder && (
        <Marker position={[respLat, respLng]} icon={respIcon}>
          <Popup>
            <div className="p-1 text-xs">
              <span className="font-semibold text-ink">
                {responder.full_name || 'Assigned Responder'}
              </span>
              {responder.updated_at && (
                <p className="text-[10px] text-ink-faint mt-0.5">
                  Updated {timeAgo(responder.updated_at)}
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      )}

      {/* Viewer Marker */}
      {hasViewer && (
        <Marker position={[viewLat, viewLng]} icon={myIcon}>
          <Popup>
            <div className="p-1 text-xs font-semibold text-ink">Your Location</div>
          </Popup>
        </Marker>
      )}
    </MapView>
  );
};

export default IncidentMap;
