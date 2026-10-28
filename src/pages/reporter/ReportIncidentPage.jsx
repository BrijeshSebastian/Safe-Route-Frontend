import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UploadCloud, X, AlertTriangle, RefreshCw, ArrowRight } from 'lucide-react';

import PageHeader from '../../components/layout/PageHeader';
import IncidentForm from '../../components/incident/IncidentForm';
import Button from '../../components/ui/Button';
import { useCreateIncident, useUploadImages } from '../../hooks/useIncidents';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { getErrorMessage } from '../../lib/errors';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_PHOTOS = 5;

export const ReportIncidentPage = () => {
  useDocumentTitle('Report Emergency');
  const navigate = useNavigate();
  const createIncidentMutation = useCreateIncident();
  const uploadImagesMutation = useUploadImages();

  const [photos, setPhotos] = useState([]);
  const [photoError, setPhotoError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [createdIncidentId, setCreatedIncidentId] = useState(null);
  const [uploadFailureMessage, setUploadFailureMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  // Revoke blob URLs on unmount
  useEffect(() => {
    return () => {
      photosRef.current.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, []);

  // Warn on navigation with unsaved input
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty && !isSubmitting && !createdIncidentId) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, isSubmitting, createdIncidentId]);

  const validateAndAddFiles = (incomingFiles) => {
    setPhotoError(null);
    const newFiles = Array.from(incomingFiles || []);
    if (!newFiles.length) return;

    if (photos.length + newFiles.length > MAX_PHOTOS) {
      setPhotoError(`Maximum ${MAX_PHOTOS} photos allowed. You can only add ${MAX_PHOTOS - photos.length} more.`);
      return;
    }

    const validNewPhotos = [];
    for (const file of newFiles) {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setPhotoError(`"${file.name}" is not a supported format. Please upload JPEG, PNG, or WebP only.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setPhotoError(`"${file.name}" exceeds the 5 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
        return;
      }
      validNewPhotos.push({
        file,
        previewUrl: URL.createObjectURL(file),
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
      });
    }

    setPhotos((prev) => [...prev, ...validNewPhotos]);
  };

  const handleRemovePhoto = (idToRemove) => {
    setPhotos((prev) => {
      const removed = prev.find((p) => p.id === idToRemove);
      if (removed?.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return prev.filter((p) => p.id !== idToRemove);
    });
    setPhotoError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer?.files) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFormSubmit = async (payload) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setUploadFailureMessage(null);

    let incidentId = createdIncidentId;

    try {
      // Step 1: Create incident if not already created
      if (!incidentId) {
        const createRes = await createIncidentMutation.mutateAsync(payload);
        const incident = createRes?.data?.incident || createRes?.data || createRes;
        incidentId = incident.id;
        setCreatedIncidentId(incidentId);
      }

      // Step 2: Upload photos if any
      if (photos.length > 0) {
        try {
          const filesToUpload = photos.map((p) => p.file);
          await uploadImagesMutation.mutateAsync({
            id: incidentId,
            files: filesToUpload,
          });
        } catch (uploadErr) {
          console.error('Image upload failed:', uploadErr);
          setUploadFailureMessage(
            'Your report was sent, but the photos could not be uploaded.'
          );
          setIsSubmitting(false);
          return;
        }
      }

      toast.success('Emergency report sent. An admin will review it shortly.');
      navigate(`/reporter/incidents/${incidentId}`);
    } catch (err) {
      console.error('Failed to create incident:', err);
      toast.error(getErrorMessage(err));
      setIsSubmitting(false);
    }
  };

  const handleRetryPhotoUpload = async () => {
    if (!createdIncidentId || isSubmitting) return;
    setIsSubmitting(true);
    setUploadFailureMessage(null);

    try {
      const filesToUpload = photos.map((p) => p.file);
      await uploadImagesMutation.mutateAsync({
        id: createdIncidentId,
        files: filesToUpload,
      });

      toast.success('Photos uploaded successfully.');
      navigate(`/reporter/incidents/${createdIncidentId}`);
    } catch (err) {
      console.error('Photo retry failed:', err);
      setUploadFailureMessage(
        'Your report was sent, but the photos could not be uploaded.'
      );
      toast.error('Failed to upload photos. You can retry or continue without them.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueWithoutPhotos = () => {
    if (createdIncidentId) {
      toast.success('Emergency report sent without photos.');
      navigate(`/reporter/incidents/${createdIncidentId}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Report an emergency"
        subtitle="Provide incident details, location, and optional photos to dispatch help quickly."
      />

      {/* Step 2 Photo Failure Alert with Retry */}
      {uploadFailureMessage && createdIncidentId && (
        <div
          role="alert"
          className="rounded-2xl bg-pastel-rose-bg text-pastel-rose-text border border-pastel-rose-text/20 p-5 space-y-3 shadow-soft"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 text-pastel-rose-text" aria-hidden="true" />
            <div className="text-sm font-semibold">
              {uploadFailureMessage}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={isSubmitting}
              onClick={handleRetryPhotoUpload}
              icon={RefreshCw}
            >
              Retry photo upload
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleContinueWithoutPhotos}
              icon={ArrowRight}
            >
              Continue without photos
            </Button>
          </div>
        </div>
      )}

      <IncidentForm
        onSubmit={handleFormSubmit}
        submitLabel={isSubmitting ? 'Sending report…' : 'Send emergency report'}
        isSubmitting={isSubmitting}
        showInfoBanner={true}
        autoDetectLocation={true}
        onDirtyChange={(dirty) => setIsDirty(dirty || photos.length > 0)}
      >
        {/* 7. Photos (optional) Drop Zone & Previews */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-ink-soft">
              Photos (optional)
            </label>
            <span className="text-xs text-ink-faint">
              {photos.length} / {MAX_PHOTOS} photos
            </span>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 ${
              isDragOver
                ? 'border-primary-500 bg-primary-50/50'
                : 'border-line hover:border-primary-300 hover:bg-surface-muted/50 bg-surface-card'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => {
                validateAndAddFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <div className="p-3 rounded-xl bg-primary-50 text-primary-600">
              <UploadCloud className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="text-xs sm:text-sm font-semibold text-ink">
              Drop photos here or <span className="text-primary-600 underline">choose photos</span>
            </div>
            <p className="text-[11px] text-ink-faint max-w-sm">
              Accepts JPEG, PNG, or WebP. Max 5 photos, up to 5 MB each.
            </p>
          </div>

          {photoError && (
            <p role="alert" className="text-xs font-medium text-pastel-rose-text">
              {photoError}
            </p>
          )}

          {/* Photo Previews */}
          {photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              {photos.map((item) => (
                <div
                  key={item.id}
                  className="relative group aspect-square rounded-xl overflow-hidden border border-line bg-surface-muted shadow-xs"
                >
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemovePhoto(item.id);
                    }}
                    aria-label={`Remove photo ${item.file.name}`}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-surface-card/90 text-ink-soft hover:text-pastel-rose-text hover:bg-surface-card shadow-xs transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute inset-x-0 bottom-0 bg-ink/60 text-[10px] text-white px-1.5 py-0.5 truncate text-center">
                    {(item.file.size / (1024 * 1024)).toFixed(1)} MB
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </IncidentForm>
    </div>
  );
};

export default ReportIncidentPage;
