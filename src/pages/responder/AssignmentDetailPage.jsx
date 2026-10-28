import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Navigation,
  MapPin,
  Copy,
  Phone,
  Clock,
  Compass,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import TypeIcon from '../../components/incident/TypeIcon';
import StatusBadge from '../../components/incident/StatusBadge';
import SeverityBadge from '../../components/incident/SeverityBadge';
import StatusProgress from '../../components/incident/StatusProgress';
import ImageGallery from '../../components/incident/ImageGallery';
import IncidentMap from '../../components/map/IncidentMap';
import AssignmentActions from '../../components/responder/AssignmentActions';

import {
  useAssignment,
  useAcceptAssignment,
  useRejectAssignment,
  useStartTravel,
  useArrived,
  useResolveAssignment,
} from '../../hooks/useResponder';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useLocationSharing } from '../../hooks/useLocationSharing';
import { googleMapsDirectionsUrl, googleMapsPinUrl } from '../../lib/maps';
import { toNumber, isValidCoord, haversineDistanceKm } from '../../lib/geo';
import { formatDateTime, formatDistanceKm } from '../../lib/format';
import { INCIDENT_TYPE_LABELS, ASSIGNMENT_STATUS_LABELS } from '../../lib/constants';

export const AssignmentDetailPage = () => {
  useDocumentTitle('Assignment Details');
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data: assignment,
    isLoading,
    isError,
    error,
    refetch,
  } = useAssignment(id);

  const { lastPosition } = useLocationSharing();

  const acceptMutation = useAcceptAssignment();
  const rejectMutation = useRejectAssignment();
  const startTravelMutation = useStartTravel();
  const arrivedMutation = useArrived();
  const resolveMutation = useResolveAssignment();

  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-32 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-80 w-full rounded-2xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !assignment) {
    const isNotFound = error?.response?.status === 404;

    return (
      <div className="max-w-4xl mx-auto py-8">
        <ErrorState
          title={isNotFound ? 'This assignment is no longer available' : 'Failed to load assignment'}
          message={
            isNotFound
              ? 'The emergency may have been cancelled, reassigned, or deleted.'
              : error?.message || 'Failed to retrieve assignment details.'
          }
          onRetry={isNotFound ? undefined : refetch}
        />
        <div className="mt-4 text-center">
          <Link
            to="/responder/assignments"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to my assignments
          </Link>
        </div>
      </div>
    );
  }

  const incident = assignment.incident || {};
  const reporter = incident.reporter || {};

  const lat = toNumber(incident.latitude);
  const lng = toNumber(incident.longitude);
  const hasCoords = lat !== null && lng !== null && isValidCoord(lat, lng);

  const mapsUrl = hasCoords ? googleMapsDirectionsUrl(lat, lng) : '';
  const pinUrl = hasCoords ? googleMapsPinUrl(lat, lng) : '';

  // Distance computation
  let distanceText = null;
  if (hasCoords && lastPosition?.latitude && lastPosition?.longitude) {
    const dist = haversineDistanceKm(
      lastPosition.latitude,
      lastPosition.longitude,
      lat,
      lng
    );
    if (dist !== null) {
      distanceText = formatDistanceKm(dist);
    }
  }

  const handleCopyCoords = async () => {
    if (!hasCoords) return;
    try {
      await navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      setCopied(true);
      toast.success('Coordinates copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy coordinates');
    }
  };

  const handleAccept = async () => {
    await acceptMutation.mutateAsync(assignment.id);
  };

  const handleReject = async (notes) => {
    await rejectMutation.mutateAsync({ id: assignment.id, notes });
    navigate('/responder/assignments');
  };

  const handleStartTravel = async () => {
    await startTravelMutation.mutateAsync(assignment.id);
  };

  const handleArrived = async () => {
    await arrivedMutation.mutateAsync(assignment.id);
  };

  const handleResolve = async (notes) => {
    await resolveMutation.mutateAsync({ id: assignment.id, notes });
  };

  const isCompleted = assignment.assignment_status === 'completed' || incident.status === 'resolved';
  const isRejected = assignment.assignment_status === 'rejected';

  // Viewer coords for map
  const viewerCoords = lastPosition?.latitude && lastPosition?.longitude ? lastPosition : null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24 lg:pb-8">
      {/* 1. Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          to="/responder/assignments"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-ink-soft hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to my assignments
        </Link>

        {isCompleted && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/responder')}
          >
            Back to dashboard
          </Button>
        )}
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 cols on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <Card className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <TypeIcon type={incident.incident_type} size="lg" />
                <div className="space-y-1 min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-ink leading-snug">
                    {incident.title || 'Emergency Call'}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-ink-faint">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Assigned {formatDateTime(assignment.createdAt || assignment.created_at)}
                    </span>
                    {assignment.assignment_status && (
                      <>
                        <span>•</span>
                        <span className="font-semibold text-ink-soft capitalize" aria-live="polite">
                          Status: {ASSIGNMENT_STATUS_LABELS[assignment.assignment_status] || assignment.assignment_status}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <SeverityBadge severity={incident.severity} size="md" />
                <StatusBadge status={incident.status} size="md" />
              </div>
            </div>

            {/* Stepper Strip */}
            <div className="pt-2 border-t border-line">
              <StatusProgress status={incident.status} />
            </div>
          </Card>

          {/* 2. Location Card (Most Prominent) */}
          <Card className="space-y-4 border-primary-200/80 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-ink">
                <MapPin className="w-5 h-5 text-primary-600 shrink-0" />
                <h2 className="text-sm sm:text-base font-bold">Emergency Location & Route</h2>
              </div>

              {distanceText && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-50 text-primary-800 border border-primary-200/60 text-xs font-semibold self-start sm:self-auto">
                  <Compass className="w-3.5 h-3.5 text-primary-600" />
                  <span>About {distanceText} away</span>
                </div>
              )}
            </div>

            {/* Address & Coordinates */}
            <div className="bg-surface-page p-3.5 rounded-xl border border-line space-y-2">
              <p className="text-sm font-semibold text-ink leading-relaxed">
                {incident.address || 'No street address provided.'}
              </p>

              {hasCoords && (
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-line/60 text-xs">
                  <span className="font-mono text-ink-soft">
                    {lat.toFixed(6)}, {lng.toFixed(6)}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCoords}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-600 hover:text-primary-700 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? 'Copied' : 'Copy coordinates'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Big Google Maps Navigation Buttons */}
            {hasCoords ? (
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm transition-colors shadow-soft cursor-pointer text-center"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Open in Google Maps</span>
                  </a>

                  <a
                    href={pinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-line bg-surface-card hover:bg-surface-muted text-ink font-semibold text-xs sm:text-sm transition-colors cursor-pointer text-center"
                  >
                    <span>View pin</span>
                    <ExternalLink className="w-3.5 h-3.5 text-ink-faint" />
                  </a>
                </div>

                {/* Map Component */}
                <div className="pt-2">
                  <IncidentMap
                    incident={incident}
                    viewer={viewerCoords}
                  />
                </div>
              </div>
            ) : (
              <div
                role="alert"
                className="rounded-xl bg-pastel-rose-bg text-pastel-rose-text border border-pastel-rose-text/20 p-4 flex items-center gap-3 text-xs sm:text-sm"
              >
                <AlertTriangle className="w-5 h-5 shrink-0 text-pastel-rose-text" />
                <span>Invalid or missing emergency coordinates. Location map unavailable.</span>
              </div>
            )}
          </Card>

          {/* 3. Incident Details Card */}
          <Card className="space-y-4">
            <h2 className="text-sm font-bold text-ink">Incident Details</h2>

            <div className="text-xs sm:text-sm text-ink leading-relaxed whitespace-pre-line bg-surface-page p-4 rounded-xl border border-line">
              {incident.description || 'No detailed description.'}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl border border-line bg-surface-card">
                <span className="block text-[11px] font-semibold text-ink-faint uppercase tracking-wider">
                  Incident Category
                </span>
                <span className="text-xs font-semibold text-ink mt-0.5 block">
                  {INCIDENT_TYPE_LABELS[incident.incident_type] || incident.incident_type}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-line bg-surface-card">
                <span className="block text-[11px] font-semibold text-ink-faint uppercase tracking-wider">
                  Reported Time
                </span>
                <span className="text-xs font-semibold text-ink mt-0.5 block">
                  {formatDateTime(incident.createdAt || incident.created_at)}
                </span>
              </div>

              {/* Reporter Contact Info */}
              <div className="p-3 rounded-xl border border-line bg-surface-card sm:col-span-2">
                <span className="block text-[11px] font-semibold text-ink-faint uppercase tracking-wider">
                  Reporter
                </span>
                <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
                  <span className="text-xs font-semibold text-ink">
                    {reporter.full_name || 'Citizen Reporter'}
                  </span>

                  {reporter.phone && (
                    <a
                      href={`tel:${reporter.phone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pastel-mint-bg text-pastel-mint-text border border-pastel-mint-text/20 text-xs font-bold hover:bg-pastel-mint-bg/80 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call reporter ({reporter.phone})</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Assignment Notes if any */}
              {assignment.notes && (
                <div className="p-3 rounded-xl border border-line bg-surface-card sm:col-span-2">
                  <span className="block text-[11px] font-semibold text-ink-faint uppercase tracking-wider">
                    Dispatch Notes
                  </span>
                  <p className="text-xs text-ink-soft mt-0.5 leading-relaxed">
                    {assignment.notes}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* 4. Photos Gallery */}
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-ink">Attached Photos</h2>
              <span className="text-xs text-ink-faint">
                {incident.images?.length || 0} photos
              </span>
            </div>
            <ImageGallery images={incident.images || []} />
          </Card>
        </div>

        {/* Right Column (Desktop Action Sidebar) */}
        <div className="hidden lg:block space-y-6 lg:sticky lg:top-24">
          <Card className="space-y-4 border-primary-200">
            <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
              Dispatch Action
            </h2>
            <p className="text-xs text-ink-faint">
              Update the dispatch status as you proceed with the emergency response.
            </p>

            <div className="pt-2">
              <AssignmentActions
                assignment={assignment}
                onAccept={handleAccept}
                onReject={handleReject}
                onStartTravel={handleStartTravel}
                onArrived={handleArrived}
                onResolve={handleResolve}
                isLoading={
                  acceptMutation.isPending ||
                  rejectMutation.isPending ||
                  startTravelMutation.isPending ||
                  arrivedMutation.isPending ||
                  resolveMutation.isPending
                }
              />
            </div>
          </Card>
        </div>
      </div>

      {/* Mobile Fixed Action Bar (Sticky above bottom navigation) */}
      {!isCompleted && !isRejected && (
        <div className="lg:hidden fixed bottom-16 inset-x-0 bg-surface-card border-t border-line p-3.5 shadow-lg z-30">
          <div className="max-w-md mx-auto">
            <AssignmentActions
              assignment={assignment}
              onAccept={handleAccept}
              onReject={handleReject}
              onStartTravel={handleStartTravel}
              onArrived={handleArrived}
              onResolve={handleResolve}
              isLoading={
                acceptMutation.isPending ||
                rejectMutation.isPending ||
                startTravelMutation.isPending ||
                arrivedMutation.isPending ||
                resolveMutation.isPending
              }
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentDetailPage;
