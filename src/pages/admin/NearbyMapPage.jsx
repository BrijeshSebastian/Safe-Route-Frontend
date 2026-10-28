import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Marker, Popup, Circle } from 'react-leaflet';
import {
  MapPin,
  Search,
  Navigation,
  List,
  Map as MapIcon,
  X,
  ExternalLink,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import TypeIcon from '../../components/incident/TypeIcon';
import StatusBadge from '../../components/incident/StatusBadge';
import SeverityBadge from '../../components/incident/SeverityBadge';
import MapView, { FlyTo } from '../../components/map/MapView';
import { incidentIcon, myLocationIcon } from '../../components/map/markers';

import { useNearbyIncidents } from '../../hooks/useAdmin';
import { useGeolocation } from '../../hooks/useGeolocation';
import { searchAddress } from '../../lib/nominatim';
import { FALLBACK_CENTER, toNumber, isValidCoord } from '../../lib/geo';
import { formatDistanceKm, timeAgo } from '../../lib/format';
import { INCIDENT_TYPE_LABELS } from '../../lib/constants';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export const NearbyMapPage = () => {
  useDocumentTitle('Nearby Incidents');
  const { getCurrentPosition } = useGeolocation();

  // Center state [lat, lng]
  const [center, setCenter] = useState(FALLBACK_CENTER);
  const [centerLabel, setCenterLabel] = useState('Bangalore Central (Default)');
  const [isLocating, setIsLocating] = useState(false);

  // Radius state (1-100 km, default 5)
  const [radiusKm, setRadiusKm] = useState(5);
  const [debouncedRadius, setDebouncedRadius] = useState(5);

  // Search input & suggestions
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchAbortRef = useRef(null);

  // View mode: 'map' | 'split' | 'list'
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'list'

  // Debounce radius changes (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedRadius(radiusKm);
    }, 500);
    return () => clearTimeout(timer);
  }, [radiusKm]);

  // Attempt auto-detect on mount
  useEffect(() => {
    let active = true;
    getCurrentPosition({ timeout: 5000 })
      .then((coords) => {
        if (!active) return;
        const lat = Number(Number(coords.latitude).toFixed(6));
        const lng = Number(Number(coords.longitude).toFixed(6));
        if (isValidCoord(lat, lng)) {
          setCenter([lat, lng]);
          setCenterLabel('Current Location');
        }
      })
      .catch(() => {
        // Fallback remains active
      });

    return () => {
      active = false;
    };
  }, [getCurrentPosition]);

  // Debounced Place Search with Nominatim
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
    }
    const controller = new AbortController();
    searchAbortRef.current = controller;

    setIsSearching(true);
    const timer = setTimeout(() => {
      searchAddress(trimmed, controller.signal)
        .then((results) => {
          setSuggestions(results || []);
          setShowSuggestions(true);
          setIsSearching(false);
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            setIsSearching(false);
          }
        });
    }, 500);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  // Handle location detection button
  const handleUseMyLocation = async () => {
    try {
      setIsLocating(true);
      const coords = await getCurrentPosition({ enableHighAccuracy: true });
      const lat = Number(Number(coords.latitude).toFixed(6));
      const lng = Number(Number(coords.longitude).toFixed(6));
      if (isValidCoord(lat, lng)) {
        setCenter([lat, lng]);
        setCenterLabel('Current Location');
        setSearchQuery('');
        setSuggestions([]);
      }
    } catch (err) {
      console.warn('Geolocation failed:', err.message);
    } finally {
      setIsLocating(false);
    }
  };

  // Handle suggestion pick
  const handleSelectSuggestion = (item) => {
    const lat = Number(parseFloat(item.lat).toFixed(6));
    const lon = Number(parseFloat(item.lon).toFixed(6));
    if (isValidCoord(lat, lon)) {
      setCenter([lat, lon]);
      setCenterLabel(item.display_name?.split(',')[0] || item.display_name || 'Selected Place');
      setSearchQuery('');
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Query nearby incidents
  const nearbyParams = useMemo(() => {
    return {
      latitude: center[0],
      longitude: center[1],
      radius: debouncedRadius,
    };
  }, [center, debouncedRadius]);

  const { data } = useNearbyIncidents(nearbyParams);

  const incidents = useMemo(() => {
    const list = data?.data?.incidents || data?.incidents || [];
    return [...list].sort((a, b) => Number(a.distance || 0) - Number(b.distance || 0));
  }, [data]);

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <PageHeader
        title="Active Incident Radar"
        subtitle="Geographic radius monitoring for emergencies in progress"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'map' ? 'primary' : 'secondary'}
              size="sm"
              icon={MapIcon}
              onClick={() => setViewMode('map')}
            >
              Map
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'secondary'}
              size="sm"
              icon={List}
              onClick={() => setViewMode('list')}
            >
              List ({incidents.length})
            </Button>
          </div>
        }
      />

      {/* Control Strip (Center search, Radius slider, Legend) */}
      <Card className="p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* 1. Center Search & Location Button */}
          <div className="md:col-span-6 relative z-20">
            <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-1.5">
              Center Point ({centerLabel})
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Search city, neighborhood, or landmark…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                  }}
                  className="pl-9 pr-8"
                />
                {isSearching ? (
                  <Loader2 className="w-4 h-4 text-primary-600 animate-spin absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                ) : (
                  <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                )}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSuggestions([]);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <Button
                type="button"
                variant="secondary"
                size="md"
                icon={Navigation}
                onClick={handleUseMyLocation}
                loading={isLocating}
                title="Use current GPS location"
                className="shrink-0"
              >
                My Location
              </Button>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-surface-card rounded-xl border border-line shadow-lg max-h-60 overflow-y-auto divide-y divide-line">
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className="w-full text-left p-3 hover:bg-surface-page text-xs sm:text-sm text-ink transition-colors flex items-start gap-2.5"
                  >
                    <MapPin className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{item.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Radius Slider */}
          <div className="md:col-span-6 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-ink-muted uppercase tracking-wider">
                Radius Distance
              </span>
              <span className="font-bold text-primary-700 bg-primary-100 px-2 py-0.5 rounded-full">
                {radiusKm} km
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={radiusKm}
              onChange={(e) => setRadiusKm(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-line rounded-lg appearance-none cursor-pointer accent-primary-600 focus:outline-hidden"
              aria-label="Filter radius in kilometers"
            />
            <div className="flex items-center justify-between text-[11px] text-ink-muted">
              <span>1 km</span>
              <span>25 km</span>
              <span>50 km</span>
              <span>100 km</span>
            </div>
          </div>
        </div>

        {/* Severity Legend & Results Count */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-line text-xs">
          <div className="text-ink-muted">
            Showing active incidents within <span className="font-semibold text-ink">{debouncedRadius} km</span> of center
            (excludes resolved & cancelled)
          </div>

          {/* Severity Pin Legend */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-medium text-ink-soft">Legend:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-pastel-mint-text border border-white shadow-xs" />
              <span>Low</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-pastel-butter-text border border-white shadow-xs" />
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-pastel-peach-text border border-white shadow-xs" />
              <span>High</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-pastel-rose-text border border-white shadow-xs" />
              <span>Critical</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Main View: Map or List */}
      {viewMode === 'map' ? (
        <div className="relative h-[70vh] w-full rounded-2xl overflow-hidden border border-line shadow-soft bg-surface-muted">
          <MapView center={center} zoom={12} className="h-full w-full">
            <FlyTo center={center} zoom={12} />

            {/* Radius Coverage Circle */}
            <Circle
              center={center}
              radius={debouncedRadius * 1000}
              pathOptions={{
                color: '#5766D6',
                fillColor: '#5766D6',
                fillOpacity: 0.08,
                weight: 1.5,
                dashArray: '5 5',
              }}
            />

            {/* Center Anchor Marker */}
            <Marker position={center} icon={myLocationIcon()}>
              <Popup>
                <div className="text-xs font-medium">
                  <p className="font-semibold text-ink">Center Search Point</p>
                  <p className="text-ink-muted">{centerLabel}</p>
                </div>
              </Popup>
            </Marker>

            {/* Nearby Incident Markers */}
            {incidents.map((incident) => {
              const lat = toNumber(incident.latitude);
              const lng = toNumber(incident.longitude);
              if (!isValidCoord(lat, lng)) return null;

              const distance = Number(incident.distance || 0);

              return (
                <Marker
                  key={incident.id}
                  position={[lat, lng]}
                  icon={incidentIcon(incident.severity || 'medium')}
                >
                  <Popup>
                    <div className="text-xs p-1 space-y-1.5 min-w-[200px]">
                      <div className="flex items-center justify-between gap-2">
                        <TypeIcon type={incident.incident_type} size="sm" />
                        <StatusBadge status={incident.status} size="sm" />
                      </div>

                      <div>
                        <p className="font-bold text-ink text-sm">
                          #{incident.id} · {incident.title}
                        </p>
                        {incident.address && (
                          <p className="text-ink-muted line-clamp-1">{incident.address}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-line">
                        <span className="font-semibold text-primary-700 bg-primary-100 px-2 py-0.5 rounded-full">
                          {formatDistanceKm(distance)} away
                        </span>

                        <Link
                          to={`/admin/incidents/${incident.id}`}
                          className="font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapView>
        </div>
      ) : (
        /* List View (Table / Cards for accessibility & mobile) */
        <Card title={`Active Incidents Within ${debouncedRadius} km (${incidents.length})`}>
          {incidents.length === 0 ? (
            <div className="p-8 text-center text-xs text-ink-muted">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-80" />
              <p className="font-semibold text-ink text-sm">No active emergencies found</p>
              <p className="text-ink-muted mt-0.5">
                Try expanding the radar radius slider or choosing a different center location.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-line -my-2">
              {incidents.map((incident) => {
                const distance = Number(incident.distance || 0);
                return (
                  <div
                    key={incident.id}
                    className="py-3.5 flex items-center justify-between gap-3 text-xs sm:text-sm hover:bg-surface-page/50 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <TypeIcon type={incident.incident_type} size="sm" />
                      <div className="min-w-0">
                        <Link
                          to={`/admin/incidents/${incident.id}`}
                          className="font-semibold text-ink hover:text-primary-600 truncate block"
                        >
                          #{incident.id} · {incident.title}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-ink-muted flex-wrap mt-0.5">
                          <span>{INCIDENT_TYPE_LABELS[incident.incident_type] || incident.incident_type}</span>
                          <span>·</span>
                          <SeverityBadge severity={incident.severity} size="sm" />
                          <span>·</span>
                          <span>{timeAgo(incident.createdAt || incident.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-semibold text-primary-700 bg-primary-100 px-2.5 py-1 rounded-full text-xs">
                        {formatDistanceKm(distance)}
                      </span>

                      <Button
                        as={Link}
                        to={`/admin/incidents/${incident.id}`}
                        variant="secondary"
                        size="sm"
                      >
                        Open
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default NearbyMapPage;
