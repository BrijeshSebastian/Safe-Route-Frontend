import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PhoneCall } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import FormField from '../ui/FormField';
import LocationPicker from '../map/LocationPicker';
import TypeIcon from './TypeIcon';
import {
  INCIDENT_TYPES,
  INCIDENT_TYPE_LABELS,
  SEVERITIES,
  SEVERITY_LABELS,
} from '../../lib/constants';
import { toNumber, isValidCoord } from '../../lib/geo';

const TYPE_OPTIONS = [
  INCIDENT_TYPES.ROAD_ACCIDENT,
  INCIDENT_TYPES.FIRE,
  INCIDENT_TYPES.MEDICAL_EMERGENCY,
  INCIDENT_TYPES.FLOOD,
  INCIDENT_TYPES.EARTHQUAKE,
  INCIDENT_TYPES.CRIME,
  INCIDENT_TYPES.GAS_LEAK,
  INCIDENT_TYPES.ELECTRICAL_HAZARD,
  INCIDENT_TYPES.OTHER,
];

const SEVERITY_OPTIONS = [
  { value: SEVERITIES.LOW, label: SEVERITY_LABELS[SEVERITIES.LOW], activeClass: 'bg-pastel-mint-bg text-pastel-mint-text border-pastel-mint-text/30 font-semibold' },
  { value: SEVERITIES.MEDIUM, label: SEVERITY_LABELS[SEVERITIES.MEDIUM], activeClass: 'bg-pastel-butter-bg text-pastel-butter-text border-pastel-butter-text/30 font-semibold' },
  { value: SEVERITIES.HIGH, label: SEVERITY_LABELS[SEVERITIES.HIGH], activeClass: 'bg-pastel-peach-bg text-pastel-peach-text border-pastel-peach-text/30 font-semibold' },
  { value: SEVERITIES.CRITICAL, label: SEVERITY_LABELS[SEVERITIES.CRITICAL], activeClass: 'bg-pastel-rose-bg text-pastel-rose-text border-pastel-rose-text/30 font-semibold' },
];

export const IncidentForm = ({
  initialValues = {},
  onSubmit,
  submitLabel = 'Send emergency report',
  isSubmitting = false,
  showInfoBanner = true,
  autoDetectLocation = true,
  isEdit = false,
  children = null,
  onDirtyChange,
  secondaryAction = null,
}) => {
  const [incidentType, setIncidentType] = useState(
    initialValues.incident_type || INCIDENT_TYPES.ROAD_ACCIDENT
  );
  const [severity, setSeverity] = useState(
    initialValues.severity || SEVERITIES.MEDIUM
  );
  const [title, setTitle] = useState(initialValues.title || '');
  const [description, setDescription] = useState(initialValues.description || '');
  const [location, setLocation] = useState({
    latitude: initialValues.latitude != null ? toNumber(initialValues.latitude) : null,
    longitude: initialValues.longitude != null ? toNumber(initialValues.longitude) : null,
    address: initialValues.address || '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Sync state if initialValues changes (e.g. async fetch in edit page)
  useEffect(() => {
    if (initialValues.title !== undefined) {
      setTitle(initialValues.title || '');
    }
    if (initialValues.description !== undefined) {
      setDescription(initialValues.description || '');
    }
    if (initialValues.incident_type) {
      setIncidentType(initialValues.incident_type);
    }
    if (initialValues.severity) {
      setSeverity(initialValues.severity);
    }
    if (initialValues.latitude != null || initialValues.longitude != null || initialValues.address != null) {
      setLocation({
        latitude: initialValues.latitude != null ? toNumber(initialValues.latitude) : null,
        longitude: initialValues.longitude != null ? toNumber(initialValues.longitude) : null,
        address: initialValues.address || '',
      });
    }
  }, [
    initialValues.title,
    initialValues.description,
    initialValues.incident_type,
    initialValues.severity,
    initialValues.latitude,
    initialValues.longitude,
    initialValues.address,
  ]);

  // Compute changed fields relative to initialValues
  const changedFields = useMemo(() => {
    const changes = {};

    if (title !== (initialValues.title || '')) {
      changes.title = title.trim();
    }
    if (description !== (initialValues.description || '')) {
      changes.description = description.trim();
    }
    if (incidentType !== (initialValues.incident_type || INCIDENT_TYPES.ROAD_ACCIDENT)) {
      changes.incident_type = incidentType;
    }
    if (severity !== (initialValues.severity || SEVERITIES.MEDIUM)) {
      changes.severity = severity;
    }

    const initLat = initialValues.latitude != null ? toNumber(initialValues.latitude) : null;
    const initLng = initialValues.longitude != null ? toNumber(initialValues.longitude) : null;
    const currentLat = location.latitude != null ? toNumber(location.latitude) : null;
    const currentLng = location.longitude != null ? toNumber(location.longitude) : null;

    if (currentLat !== initLat && currentLat !== null) {
      changes.latitude = currentLat;
    }
    if (currentLng !== initLng && currentLng !== null) {
      changes.longitude = currentLng;
    }

    const initAddress = (initialValues.address || '').trim();
    const currentAddress = (location.address || '').trim();
    if (currentAddress !== initAddress) {
      changes.address = currentAddress;
    }

    return changes;
  }, [title, description, incidentType, severity, location, initialValues]);

  const isDirty = useMemo(() => {
    if (isEdit) {
      return Object.keys(changedFields).length > 0;
    }
    return Boolean(
      title.trim() ||
      description.trim() ||
      incidentType !== INCIDENT_TYPES.ROAD_ACCIDENT ||
      severity !== SEVERITIES.MEDIUM ||
      location.latitude != null ||
      location.address
    );
  }, [isEdit, changedFields, title, description, incidentType, severity, location]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const validate = useCallback(() => {
    const newErrors = {};

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      newErrors.title = 'Title is required';
    } else if (trimmedTitle.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    } else if (trimmedTitle.length > 200) {
      newErrors.title = 'Title cannot exceed 200 characters';
    }

    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      newErrors.description = 'Description is required';
    } else if (trimmedDesc.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    const lat = toNumber(location.latitude);
    const lng = toNumber(location.longitude);
    if (lat === null || lng === null || !isValidCoord(lat, lng)) {
      newErrors.location = 'Please set the emergency location';
    }

    setErrors(newErrors);
    return newErrors;
  }, [title, description, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      title: true,
      description: true,
      location: true,
    });

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const trimmedAddress = (location.address || '').trim();
    const payload = {
      title: title.trim(),
      description: description.trim(),
      incident_type: incidentType,
      severity,
      latitude: toNumber(location.latitude),
      longitude: toNumber(location.longitude),
    };
    if (trimmedAddress) {
      payload.address = trimmedAddress;
    }

    await onSubmit?.(payload, { changedFields, isDirty });
  };

  return (
    <Card className="space-y-6">
      {/* 1. Life-Threatening Emergency Notice */}
      {showInfoBanner && (
        <div
          role="region"
          aria-label="Emergency warning"
          className="rounded-xl bg-pastel-sky-bg text-pastel-sky-text border border-pastel-sky-text/20 p-4 flex items-start gap-3"
        >
          <div className="p-2 rounded-lg bg-pastel-sky-text/10 text-pastel-sky-text shrink-0 mt-0.5">
            <PhoneCall className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="text-xs sm:text-sm leading-relaxed">
            <span className="font-semibold block sm:inline">In a life-threatening emergency, call your local emergency number first (112 in India). </span>
            <span className="text-ink-soft">SafeRoute helps coordinate responders.</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* 2. What happened? — Type Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-ink-soft">
            What happened? <span className="text-pastel-rose-text" aria-hidden="true">*</span>
          </label>
          <div
            role="radiogroup"
            aria-label="Incident type"
            className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3"
          >
            {TYPE_OPTIONS.map((typeKey) => {
              const isSelected = incidentType === typeKey;
              const label = INCIDENT_TYPE_LABELS[typeKey] || typeKey;
              return (
                <button
                  key={typeKey}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setIncidentType(typeKey)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50/70 text-ink shadow-xs ring-2 ring-primary-500/20'
                      : 'border-line bg-surface-card hover:bg-surface-muted text-ink-soft hover:text-ink'
                  }`}
                >
                  <TypeIcon type={typeKey} size="sm" />
                  <span className="text-xs font-semibold leading-tight line-clamp-2">
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Severity Segmented Control */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-ink-soft">
            Severity <span className="text-pastel-rose-text" aria-hidden="true">*</span>
          </label>
          <div
            role="radiogroup"
            aria-label="Severity level"
            className="grid grid-cols-4 gap-1.5 sm:gap-2 p-1.5 bg-surface-muted rounded-xl border border-line"
          >
            {SEVERITY_OPTIONS.map((opt) => {
              const isSelected = severity === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSeverity(opt.value)}
                  className={`py-2 px-1 text-center rounded-lg text-xs transition-all border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${
                    isSelected
                      ? `${opt.activeClass} shadow-xs`
                      : 'border-transparent text-ink-soft hover:text-ink hover:bg-surface-card'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Title Input */}
        <FormField
          id="incident-title"
          label="Title"
          required
          error={touched.title ? errors.title : undefined}
        >
          <div className="space-y-1">
            <Input
              id="incident-title"
              placeholder="e.g. Car accident near the bus stand"
              value={title}
              maxLength={200}
              hasError={touched.title && Boolean(errors.title)}
              onChange={(e) => {
                setTitle(e.target.value);
                if (touched.title) {
                  setErrors((prev) => ({ ...prev, title: undefined }));
                }
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, title: true }))}
            />
            <div className="flex justify-end text-[11px] text-ink-faint">
              <span>{title.length} / 200</span>
            </div>
          </div>
        </FormField>

        {/* 5. Description Textarea */}
        <FormField
          id="incident-description"
          label="Description"
          required
          hint="Tell responders what they will find: number of people, hazards, landmarks"
          error={touched.description ? errors.description : undefined}
        >
          <div className="space-y-1">
            <Textarea
              id="incident-description"
              rows={4}
              placeholder="Tell responders what they will find: number of people, hazards, landmarks"
              value={description}
              hasError={touched.description && Boolean(errors.description)}
              onChange={(e) => {
                setDescription(e.target.value);
                if (touched.description) {
                  setErrors((prev) => ({ ...prev, description: undefined }));
                }
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, description: true }))}
            />
            <div className="flex justify-end text-[11px] text-ink-faint">
              <span>{description.length} characters (min 10)</span>
            </div>
          </div>
        </FormField>

        {/* 6. Location Picker */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-ink-soft">
            Location <span className="text-pastel-rose-text" aria-hidden="true">*</span>
          </label>
          <LocationPicker
            value={location}
            onChange={(nextLoc) => {
              setLocation(nextLoc);
              setErrors((prev) => ({ ...prev, location: undefined }));
            }}
            error={touched.location ? errors.location : undefined}
            autoDetect={autoDetectLocation}
            severity={severity}
          />
        </div>

        {/* 7. Additional Form Slots (e.g. Photo Dropzone) */}
        {children}

        {/* 8. Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-line">
          {secondaryAction}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isSubmitting}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {submitLabel}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default IncidentForm;
