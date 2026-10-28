import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, AlertCircle } from 'lucide-react';

import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import IncidentForm from '../../components/incident/IncidentForm';
import { useIncident, useUpdateIncident } from '../../hooks/useIncidents';
import { INCIDENT_STATUSES, STATUS_LABELS } from '../../lib/constants';
import { getErrorMessage } from '../../lib/errors';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export const EditIncidentPage = () => {
  useDocumentTitle('Edit Incident');
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data: incidentData,
    isLoading,
    isError,
    error,
    refetch,
  } = useIncident(id);

  const incident = incidentData?.data?.incident || incidentData?.data || incidentData?.incident;
  const updateIncidentMutation = useUpdateIncident();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-36 rounded-xl" />
        <Card className="p-6 space-y-4">
          <Skeleton className="h-7 w-1/3" />
          <Skeleton className="h-40 w-full" />
        </Card>
      </div>
    );
  }

  if (isError || !incident) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <ErrorState
          title="Could not load incident"
          message={getErrorMessage(error)}
          onRetry={refetch}
        />
        <div className="mt-4 text-center">
          <Link
            to="/reporter/incidents"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to my incidents
          </Link>
        </div>
      </div>
    );
  }

  // Only 'pending' incidents can be edited
  if (incident.status !== INCIDENT_STATUSES.PENDING) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          to={`/reporter/incidents/${id}`}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-ink-soft hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to report detail
        </Link>

        <Card className="p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-pastel-butter-bg text-pastel-butter-text flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-ink">This report can no longer be edited</h2>
          <p className="text-xs sm:text-sm text-ink-soft max-w-md mx-auto leading-relaxed">
            Only pending reports can be edited. This incident is currently marked as{' '}
            <span className="font-semibold text-ink">
              {STATUS_LABELS[incident.status] || incident.status}
            </span>
            .
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              onClick={() => navigate(`/reporter/incidents/${id}`)}
            >
              View incident details
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const initialValues = {
    incident_type: incident.incident_type,
    severity: incident.severity,
    title: incident.title,
    description: incident.description,
    latitude: incident.latitude,
    longitude: incident.longitude,
    address: incident.address || '',
  };

  const handleSubmit = async (_, { changedFields }) => {
    const changesCount = Object.keys(changedFields).length;

    if (changesCount === 0) {
      toast('No changes to save.');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateIncidentMutation.mutateAsync({
        id,
        data: changedFields,
      });

      toast.success('Changes saved successfully.');
      navigate(`/reporter/incidents/${id}`);
    } catch (err) {
      console.error('Failed to update incident:', err);
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          to={`/reporter/incidents/${id}`}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-ink-soft hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to report detail
        </Link>
      </div>

      <PageHeader
        title="Edit emergency report"
        subtitle="Modify details or location for this pending report."
      />

      <IncidentForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        submitLabel={isSubmitting ? 'Saving changes…' : 'Save changes'}
        isSubmitting={isSubmitting}
        showInfoBanner={false}
        autoDetectLocation={false}
        isEdit={true}
        secondaryAction={
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(`/reporter/incidents/${id}`)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        }
      />
    </div>
  );
};

export default EditIncidentPage;
