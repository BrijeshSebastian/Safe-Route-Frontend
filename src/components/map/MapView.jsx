import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { osmTileConfig } from '../../lib/maps';
import { FALLBACK_CENTER, isValidCoord } from '../../lib/geo';

export const FlyTo = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (!map || typeof map.getContainer !== 'function' || !map.getContainer()) return;
    try {
      if (center && isValidCoord(center[0], center[1])) {
        map.flyTo(center, zoom ?? map.getZoom(), { duration: 0.8 });
      }
    } catch {
      // ignore during unmount transitions
    }
  }, [center, zoom, map]);
  return null;
};

export const FitBounds = ({ points = [], padding = [40, 40], maxZoom = 16 }) => {
  const map = useMap();
  useEffect(() => {
    if (!map || typeof map.getContainer !== 'function' || !map.getContainer()) return;
    try {
      const size = typeof map.getSize === 'function' ? map.getSize() : null;
      if (!size || size.x === 0 || size.y === 0) {
        return;
      }

      const validPoints = points
        .filter((p) => Array.isArray(p) && p.length === 2 && isValidCoord(p[0], p[1]))
        .map((p) => [Number(p[0]), Number(p[1])]);

      if (validPoints.length === 1) {
        map.setView(validPoints[0], Math.min(15, maxZoom || 16));
      } else if (validPoints.length > 1) {
        const bounds = L.latLngBounds(validPoints);
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding, maxZoom: maxZoom || 16 });
        }
      }
    } catch {
      // ignore during unmount transitions
    }
  }, [points, padding, maxZoom, map]);
  return null;
};

const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    if (!map || typeof map.getContainer !== 'function' || !map.getContainer()) return;
    try {
      map.invalidateSize();
    } catch {
      // ignore during unmount transitions
    }

    const container = map.getContainer();
    if (!container || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      try {
        if (map && typeof map.getContainer === 'function' && map.getContainer()) {
          map.invalidateSize();
        }
      } catch {
        // ignore during unmount transitions
      }
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, [map]);

  return null;
};

const ScrollWheelHandler = () => {
  const map = useMap();

  useEffect(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (isMobile) {
      map.scrollWheelZoom.disable();

      const enableScroll = () => {
        map.scrollWheelZoom.enable();
      };

      const disableScroll = () => {
        map.scrollWheelZoom.disable();
      };

      const container = map.getContainer();
      container.addEventListener('click', enableScroll);
      container.addEventListener('mouseleave', disableScroll);

      return () => {
        container.removeEventListener('click', enableScroll);
        container.removeEventListener('mouseleave', disableScroll);
      };
    }
  }, [map]);

  return null;
};

export const MapView = ({
  center = [FALLBACK_CENTER.lat, FALLBACK_CENTER.lng],
  zoom = 13,
  height = 'h-72 md:h-96',
  className = '',
  children,
  ...props
}) => {
  const [mapReady, setMapReady] = useState(false);
  const containerRef = useRef(null);

  const safeCenter =
    Array.isArray(center) && center.length === 2 && isValidCoord(center[0], center[1])
      ? [Number(center[0]), Number(center[1])]
      : [FALLBACK_CENTER.lat, FALLBACK_CENTER.lng];
  const safeZoom =
    typeof zoom === 'number' && !isNaN(zoom) ? Math.min(19, Math.max(1, zoom)) : 13;

  return (
    <div
      ref={containerRef}
      style={{ minHeight: '280px' }}
      className={`relative z-0 isolate w-full ${height} rounded-2xl overflow-hidden border border-line shadow-xs ${className}`}
    >
      <MapContainer
        center={safeCenter}
        zoom={safeZoom}
        minZoom={1}
        maxZoom={19}
        className="h-full w-full"
        whenReady={() => setMapReady(true)}
        {...props}
      >
        <TileLayer
          url={osmTileConfig.url}
          attribution={osmTileConfig.attribution}
          maxZoom={19}
          minZoom={1}
        />
        <MapResizer />
        <ScrollWheelHandler />
        {mapReady && children}
      </MapContainer>
    </div>
  );
};

export default MapView;
