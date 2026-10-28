import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useMapEvents, Marker } from 'react-leaflet';
import { Search, LocateFixed, AlertCircle, Loader2, MapPin } from 'lucide-react';

import MapView, { FlyTo } from './MapView';
import { incidentIcon } from './markers';
import Textarea from '../ui/Textarea';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useDebounce } from '../../hooks/useDebounce';
import { searchAddress, reverseGeocode } from '../../lib/nominatim';
import { FALLBACK_CENTER, isValidCoord, toNumber } from '../../lib/geo';

const MapEvents = ({ onMapClick, disabled }) => {
  useMapEvents({
    click(e) {
      if (!disabled && onMapClick) {
        onMapClick(e.latlng);
      }
    },
  });
  return null;
};

const DraggablePin = ({ position, onDragEnd, disabled, severity = 'medium' }) => {
  const markerRef = useRef(null);
  const icon = useMemo(() => incidentIcon(severity), [severity]);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null && onDragEnd) {
          onDragEnd(marker.getLatLng());
        }
      },
    }),
    [onDragEnd]
  );

  return (
    <Marker
      draggable={!disabled}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
      icon={icon}
    />
  );
};

export const LocationPicker = ({
  value = null,
  onChange = () => {},
  error = null,
  disabled = false,
  autoDetect = true,
  severity = 'medium',
}) => {
  const { getCurrentLocation, isLoading: isLocating } = useGeolocation();

  const [locationAlert, setLocationAlert] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [flyToCoords, setFlyToCoords] = useState(null);

  const debouncedSearch = useDebounce(searchQuery, 700);
  const searchAbortRef = useRef(null);
  const dropdownRef = useRef(null);
  const valueAddressRef = useRef(value?.address || '');

  useEffect(() => {
    valueAddressRef.current = value?.address || '';
  }, [value?.address]);

  const lat = toNumber(value?.latitude);
  const lng = toNumber(value?.longitude);
  const hasCoords = lat !== null && lng !== null && isValidCoord(lat, lng);
  const currentCoords = hasCoords ? [lat, lng] : null;

  // Handle detection on mount
  useEffect(() => {
    let active = true;
    if (autoDetect && !hasCoords) {
      getCurrentLocation()
        .then((coords) => {
          if (!active) return;
          const cleanLat = Number(Number(coords.latitude).toFixed(6));
          const cleanLng = Number(Number(coords.longitude).toFixed(6));
          setFlyToCoords([cleanLat, cleanLng]);

          // Set coordinates immediately so form validation passes without waiting on Nominatim
          onChange({
            latitude: cleanLat,
            longitude: cleanLng,
            address: value?.address || '',
          });

          // Reverse geocode in background
          reverseGeocode(cleanLat, cleanLng)
            .then((addr) => {
              if (!active || !addr) return;
              onChange({
                latitude: cleanLat,
                longitude: cleanLng,
                address: addr,
              });
            })
            .catch(() => {});
        })
        .catch(() => {
          if (!active) return;
          setLocationAlert(
            'We could not read your location. Search for the place or tap the map to set it.'
          );
        });
    }

    return () => {
      active = false;
    };
  }, []); // Run on mount

  // Debounced address search
  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.trim().length < 3) {
      setSuggestions([]);
      setIsSearching(false);
      setSearchError('');
      return;
    }

    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
    }
    const abortCtrl = new AbortController();
    searchAbortRef.current = abortCtrl;

    setIsSearching(true);
    setSearchError('');

    searchAddress(debouncedSearch, abortCtrl.signal)
      .then((results) => {
        setSuggestions(results || []);
        setIsDropdownOpen(true);
        setHighlightedIndex(-1);
        setIsSearching(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setSearchError('Search unavailable, you can still tap the map.');
        setSuggestions([]);
        setIsSearching(false);
      });

    return () => {
      abortCtrl.abort();
    };
  }, [debouncedSearch]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleManualLocationDetect = async () => {
    setLocationAlert('');
    try {
      const coords = await getCurrentLocation();
      const cleanLat = Number(Number(coords.latitude).toFixed(6));
      const cleanLng = Number(Number(coords.longitude).toFixed(6));
      setFlyToCoords([cleanLat, cleanLng]);

      // Set coordinates immediately so form validation passes instantly
      onChange({
        latitude: cleanLat,
        longitude: cleanLng,
        address: value?.address || '',
      });

      // Reverse geocode in background
      try {
        const addr = await reverseGeocode(cleanLat, cleanLng);
        if (addr) {
          onChange({
            latitude: cleanLat,
            longitude: cleanLng,
            address: addr,
          });
        }
      } catch {
        // Ignored
      }
    } catch {
      setLocationAlert(
        'We could not read your location. Search for the place or tap the map to set it.'
      );
    }
  };

  const handleSelectSuggestion = (item) => {
    const itemLat = Number(Number(item.lat).toFixed(6));
    const itemLng = Number(Number(item.lon).toFixed(6));
    setFlyToCoords([itemLat, itemLng]);
    setSearchQuery(item.display_name);
    setIsDropdownOpen(false);

    onChange({
      latitude: itemLat,
      longitude: itemLng,
      address: item.display_name || value?.address || '',
    });
  };

  const handleMapPositionChange = useCallback(
    async (latlng) => {
      const cleanLat = Number(Number(latlng.lat).toFixed(6));
      const cleanLng = Number(Number(latlng.lng).toFixed(6));

      // Emit coordinates immediately
      onChange({
        latitude: cleanLat,
        longitude: cleanLng,
        address: valueAddressRef.current || '',
      });

      try {
        const addr = await reverseGeocode(cleanLat, cleanLng);
        if (addr) {
          onChange({
            latitude: cleanLat,
            longitude: cleanLng,
            address: addr,
          });
        }
      } catch {
        // Ignored
      }
    },
    [onChange]
  );

  const handleKeyDown = (e) => {
    if (!isDropdownOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        handleSelectSuggestion(suggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  const mapCenter = currentCoords || [FALLBACK_CENTER.lat, FALLBACK_CENTER.lng];
  const mapZoom = hasCoords ? 15 : FALLBACK_CENTER.zoom;

  return (
    <div className="space-y-3">
      {/* Search and Auto-detect Bar */}
      <div className="flex flex-col sm:flex-row items-stretch gap-2 relative z-20" ref={dropdownRef}>
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-faint">
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary-600" aria-hidden="true" />
            ) : (
              <Search className="w-4 h-4" aria-hidden="true" />
            )}
          </div>
          <input
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isDropdownOpen}
            aria-haspopup="listbox"
            disabled={disabled}
            placeholder="Search a place or address"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => {
              if (suggestions.length > 0) setIsDropdownOpen(true);
            }}
            onKeyDown={handleKeyDown}
            className="w-full min-h-[44px] rounded-xl border border-line bg-surface-card pl-10 pr-3.5 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:bg-surface-muted"
          />

          {/* Autocomplete Suggestions Dropdown */}
          {isDropdownOpen && (
            <ul
              role="listbox"
              className="absolute left-0 right-0 top-full mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-line bg-surface-card shadow-soft z-50 py-1"
            >
              {suggestions.length > 0 ? (
                suggestions.map((item, index) => (
                  <li
                    key={item.place_id || index}
                    role="option"
                    aria-selected={highlightedIndex === index}
                    onClick={() => handleSelectSuggestion(item)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`flex items-start gap-2.5 px-3.5 py-2 text-xs cursor-pointer transition-colors ${
                      highlightedIndex === index
                        ? 'bg-primary-50 text-primary-900 font-medium'
                        : 'text-ink-soft hover:bg-surface-muted'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary-500" />
                    <span className="line-clamp-2">{item.display_name}</span>
                  </li>
                ))
              ) : (
                <li className="px-3.5 py-2 text-xs text-ink-faint italic">
                  {searchError || 'No places found'}
                </li>
              )}
            </ul>
          )}
        </div>

        <button
          type="button"
          disabled={disabled || isLocating}
          onClick={handleManualLocationDetect}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 min-h-[44px] rounded-xl border border-line bg-surface-card text-xs font-medium text-ink hover:bg-surface-muted transition-colors disabled:opacity-60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 shrink-0"
        >
          {isLocating ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
          ) : (
            <LocateFixed className="w-4 h-4 text-primary-600" />
          )}
          <span>{isLocating ? 'Finding location…' : 'Use my current location'}</span>
        </button>
      </div>

      {locationAlert && (
        <div
          role="status"
          className="rounded-xl bg-pastel-butter-bg text-pastel-butter-text border border-pastel-butter-text/15 p-3 text-xs flex items-start gap-2 leading-relaxed"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          <span>{locationAlert}</span>
        </div>
      )}

      {/* Map View */}
      <div className="relative">
        <MapView
          center={mapCenter}
          zoom={mapZoom}
          height="h-72 md:h-80"
          className={error ? 'border-pastel-rose-text' : ''}
        >
          {flyToCoords && <FlyTo center={flyToCoords} zoom={16} />}
          <MapEvents onMapClick={handleMapPositionChange} disabled={disabled} />
          {hasCoords && (
            <DraggablePin
              position={currentCoords}
              onDragEnd={handleMapPositionChange}
              disabled={disabled}
              severity={severity}
            />
          )}
        </MapView>
      </div>

      {/* Coordinates readout & hint */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-ink-faint gap-1 px-1">
        <span>Drag the pin or tap the map to fine-tune the location.</span>
        {hasCoords && (
          <span className="font-mono text-ink-soft">
            {lat.toFixed(6)}, {lng.toFixed(6)}
          </span>
        )}
      </div>

      {/* Manual Address Textarea */}
      <div>
        <label htmlFor="address-input" className="block text-xs font-semibold text-ink-soft mb-1">
          Address or landmarks (optional, max 500 characters)
        </label>
        <Textarea
          id="address-input"
          rows={2}
          maxLength={500}
          disabled={disabled}
          placeholder="Detailed street address, building, floor, or nearby landmark"
          value={value?.address || ''}
          onChange={(e) => {
            onChange({
              latitude: lat,
              longitude: lng,
              address: e.target.value,
            });
          }}
        />
      </div>

      {error && (
        <p role="alert" className="text-xs font-medium text-pastel-rose-text">
          {error}
        </p>
      )}
    </div>
  );
};

export default LocationPicker;
