import { respondersApi } from '../api/responders';
import { readList } from './pagination';
import { qk } from './queryKeys';

/**
 * Resolves the destination URL for a notification click based on user role and reference ID.
 *
 * In SafeRoute backend, notification.reference_id always refers to the INCIDENT ID.
 * - Reporters navigate to: /reporter/incidents/:id
 * - Admins navigate to: /admin/incidents/:id
 * - Responders must navigate to /responder/assignments/:assignmentId, resolving
 *   the assignment ID from the incident ID via assignments lookup.
 */
export async function resolveNotificationTarget(user, notification, queryClient = null) {
  if (!user || !notification) {
    return '/';
  }

  const role = user.role;
  const incidentId = notification.reference_id ? Number(notification.reference_id) : null;

  if (role === 'reporter') {
    return incidentId ? `/reporter/incidents/${incidentId}` : '/reporter/incidents';
  }

  if (role === 'admin') {
    return incidentId ? `/admin/incidents/${incidentId}` : '/admin/incidents';
  }

  if (role === 'responder') {
    if (!incidentId) {
      return '/responder/assignments';
    }

    try {
      // 1. Try checking QueryClient cache if available
      let assignments = [];
      if (queryClient) {
        const cached = queryClient.getQueryData(qk.responder.assignments({ size: 100 }));
        if (cached) {
          assignments = readList(cached, 'assignments');
        }
      }

      // 2. If not cached, fetch assignments list
      if (!assignments.length) {
        const res = await respondersApi.getAssignments({ size: 100 });
        assignments = readList(res, 'assignments');
      }

      // 3. Match assignment by incident_id or assignment.incident.id
      const match = assignments.find(
        (a) =>
          Number(a.incident_id) === incidentId ||
          Number(a.incident?.id) === incidentId
      );

      if (match?.id) {
        return `/responder/assignments/${match.id}`;
      }
    } catch (err) {
      console.warn('Failed to resolve responder assignment for notification:', err);
    }

    // Fallback if not found or lookup failed
    return '/responder/assignments';
  }

  return '/';
}

export default resolveNotificationTarget;
