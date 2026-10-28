import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Marker, Popup } from 'react-leaflet';
import { Phone, UserPlus, Info, Check, Navigation, AlertCircle } from 'lucide-react';

import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import EmptyState from '../ui/EmptyState';
import Skeleton from '../ui/Skeleton';
import MapView, { FitBounds } from '../map/MapView';
import { incidentIcon, responderIcon } from '../map/markers';

import {
  RESPONDER_TYPES,
  RESPONDER_TYPE_LABELS,
  SUGGESTED_RESPONDER_BY_INCIDENT_TYPE,
} from '../../lib/constants';
import { toNumber, isValidCoord, haversineDistanceKm } from '../../lib/geo';
import { formatDistanceKm, timeAgo } from '../../lib/format';
import {
  useAvailableResponders,
  useAssignResponder,
  useReassignResponder,
} from '../../hooks/useAdmin';

const AssignResponderDialog = ({
  incident,
  mode = 'assign',
  isOpen,
  onClose,
  onDone,
}) => {
  const isReassign = mode === 'reassign';

  // 1. Initial suggested responder type based on incident type
  const suggestedType = useMemo(() => {
    if (!incident?.incident_type) return '';
    return SUGGESTED_RESPONDER_BY_INCIDENT_TYPE[incident.incident_type] || '';
  }, [incident?.incident_type]);

  const [selectedType, setSelectedType] = useState(suggestedType);
  const [selectedResponderId, setSelectedResponderId] = useState(null);

  // 2. Fetch available responders of selected type
  const { data: respondersData, isLoading, isError } = useAvailableResponders(selectedType);

  const rawResponders = useMemo(() => {
    return respondersData?.data?.responders || respondersData?.responders || [];
  }, [respondersData]);

  // 3. Compute distance to incident and sort
  const incidentLat = toNumber(incident?.latitude);
  const incidentLng = toNumber(incident?.longitude);
  const hasIncidentCoords = isValidCoord(incidentLat, incidentLng);

  const sortedResponders = useMemo(() => {
    const list = rawResponders.map((r) => {
      const rLat = toNumber(r.last_known_latitude);
      const rLng = toNumber(r.last_known_longitude);
      const hasCoords = isValidCoord(rLat, rLng);

      const distanceKm =
        hasCoords && hasIncidentCoords
          ? haversineDistanceKm(incidentLat, incidentLng, rLat, rLng)
          : null;

      return {
        ...r,
        rLat,
        rLng,
        hasCoords,
        distanceKm,
      };
    });

    return list.sort((a, b) => {
      if (a.distanceKm !== null && b.distanceKm !== null) {
        return a.distanceKm - b.distanceKm;
      }
      if (a.distanceKm !== null) return -1;
      if (b.distanceKm !== null) return 1;
      return (a.full_name || '').localeCompare(b.full_name || '');
    });
  }, [rawResponders, incidentLat, incidentLng, hasIncidentCoords]);

  // Map markers for responders with known coordinates
  const mapPoints = useMemo(() => {
    const pts = [];
    if (hasIncidentCoords) {
      pts.push([incidentLat, incidentLng]);
    }
    sortedResponders.forEach((r) => {
      if (r.hasCoords) {
        pts.push([r.rLat, r.rLng]);
      }
    });
    return pts;
  }, [hasIncidentCoords, incidentLat, incidentLng, sortedResponders]);

  // Mutations
  const assignMutation = useAssignResponder();
  const reassignMutation = useReassignResponder();
  const isSubmitting = assignMutation.isPending || reassignMutation.isPending;

  const handleConfirm = async () => {
    if (!selectedResponderId || !incident?.id) return;

    const numericResponderId = Number(selectedResponderId);
    try {
      if (isReassign) {
        await reassignMutation.mutateAsync({
          id: incident.id,
          responderId: numericResponderId,
        });
      } else {
        await assignMutation.mutateAsync({
          id: incident.id,
          responderId: numericResponderId,
        });
      }
      onDone?.();
      onClose?.();
    } catch {
      // Error is toasted in useAdmin
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? undefined : onClose}
      title={isReassign ? 'Reassign Responder' : 'Assign Responder'}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Incident Summary */}
        <div className="p-3 bg-surface-page rounded-xl border border-line flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="min-w-0">
            <span className="text-ink-muted text-xs block">Dispatching to Incident:</span>
            <span className="font-semibold text-ink truncate block">
              #{incident?.id} · {incident?.title}
            </span>
          </div>
          {incident?.severity && (
            <Badge variant="peach" size="sm">
              {incident.severity}
            </Badge>
          )}
        </div>

        {/* 1. Responder Type Select */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block">
            Filter by responder unit
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { type: RESPONDER_TYPES.AMBULANCE, label: 'Ambulance' },
              { type: RESPONDER_TYPES.POLICE, label: 'Police' },
              { type: RESPONDER_TYPES.FIRE, label: 'Fire Rescue' },
            ].map(({ type, label }) => {
              const active = selectedType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setSelectedType(type);
                    setSelectedResponderId(null);
                  }}
                  className={`px-3 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-all text-center flex flex-col items-center justify-center gap-1 ${
                    active
                      ? 'border-primary-600 bg-primary-50 text-primary-700 shadow-xs ring-2 ring-primary-100'
                      : 'border-line bg-surface-card hover:bg-surface-page text-ink'
                  }`}
                >
                  <span>{label}</span>
                  {suggestedType === type && (
                    <span className="text-[10px] text-primary-600 font-semibold uppercase tracking-wider">
                      Suggested
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {suggestedType && (
            <p className="text-[11px] text-ink-muted flex items-center gap-1.5 pt-0.5">
              <Info className="w-3.5 h-3.5 text-primary-500 shrink-0" />
              <span>Suggested based on incident type. You can change it.</span>
            </p>
          )}
        </div>

        {/* 2. Mini Map with Incident & Responder Pins */}
        {hasIncidentCoords && (
          <div className="h-44 sm:h-48 w-full rounded-xl overflow-hidden border border-line relative z-0 isolate">
            <MapView center={[incidentLat, incidentLng]} zoom={13} className="h-full w-full">
              {mapPoints.length > 0 && <FitBounds points={mapPoints} padding={[30, 30]} />}
              {/* Incident Marker */}
              <Marker
                position={[incidentLat, incidentLng]}
                icon={incidentIcon(incident?.severity || 'medium')}
              >
                <Popup>
                  <div className="text-xs font-medium">
                    <p className="font-semibold text-ink">{incident?.title}</p>
                    <p className="text-ink-muted">Incident Location</p>
                  </div>
                </Popup>
              </Marker>

              {/* Responder Markers */}
              {sortedResponders
                .filter((r) => r.hasCoords)
                .map((r) => (
                  <Marker
                    key={r.id}
                    position={[r.rLat, r.rLng]}
                    icon={responderIcon(r.id === selectedResponderId)}
                    eventHandlers={{
                      click: () => setSelectedResponderId(r.id),
                    }}
                  >
                    <Popup>
                      <div className="text-xs">
                        <p className="font-semibold text-ink">{r.full_name}</p>
                        <p className="text-primary-600 font-medium">
                          {RESPONDER_TYPE_LABELS[r.responder_type] || r.responder_type}
                        </p>
                        {r.distanceKm !== null && (
                          <p className="text-ink-muted">{formatDistanceKm(r.distanceKm)} away</p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
            </MapView>
          </div>
        )}

        {/* 3. Available Responders List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="font-semibold uppercase tracking-wider">
              Available Units ({sortedResponders.length})
            </span>
            <span>Sorted by distance</span>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-2 pr-1 border-t border-line pt-2">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
              </div>
            ) : isError ? (
              <div className="p-4 text-center text-xs text-rose-600 bg-rose-50 rounded-xl">
                Failed to load available responders.
              </div>
            ) : sortedResponders.length === 0 ? (
              <EmptyState
                icon={AlertCircle}
                title={`No available ${selectedType || ''} responders`}
                description="All responders of this unit type are currently offline or busy. Create a new responder unit to dispatch."
                action={
                  <Button
                    as={Link}
                    to="/admin/responders/new"
                    size="sm"
                    variant="primary"
                    icon={UserPlus}
                    onClick={onClose}
                  >
                    Add responder
                  </Button>
                }
              />
            ) : (
              sortedResponders.map((responder) => {
                const isSelected = selectedResponderId === responder.id;
                return (
                  <div
                    key={responder.id}
                    onClick={() => setSelectedResponderId(responder.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs sm:text-sm ${
                      isSelected
                        ? 'border-primary-600 bg-primary-50/70 ring-2 ring-primary-200'
                        : 'border-line bg-surface-card hover:bg-surface-page'
                    }`}
                  >
                    {/* Left details */}
                    <div className="min-w-0 flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'border-primary-600 bg-primary-600 text-white'
                            : 'border-line bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-ink truncate">
                            {responder.full_name}
                          </span>
                          <Badge variant="lavender" size="sm">
                            {RESPONDER_TYPE_LABELS[responder.responder_type] || responder.responder_type}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-ink-muted mt-0.5 flex-wrap">
                          {responder.phone && (
                            <a
                              href={`tel:${responder.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 hover:text-primary-600 underline"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{responder.phone}</span>
                            </a>
                          )}

                          {responder.hasCoords && responder.last_location_at && (
                            <span>Updated {timeAgo(responder.last_location_at)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Distance Badge */}
                    <div className="shrink-0 text-right">
                      {responder.distanceKm !== null ? (
                        <div className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 bg-primary-100/70 px-2.5 py-1 rounded-full">
                          <Navigation className="w-3 h-3" />
                          <span>{formatDistanceKm(responder.distanceKm)}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-ink-muted italic">Location unknown</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-line sticky bottom-0 bg-surface-card py-2.5 -mb-1 z-10">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={handleConfirm}
            loading={isSubmitting}
            disabled={!selectedResponderId || isSubmitting}
          >
            {isReassign ? 'Reassign Responder' : 'Assign Responder'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export const AssignResponderModal = (props) => {
  if (!props.isOpen) return null;
  return <AssignResponderDialog {...props} />;
};

export default AssignResponderModal;
