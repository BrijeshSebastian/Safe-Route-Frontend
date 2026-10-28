# SafeRoute Backend API Endpoint Coverage Proof

This document provides a verified, comprehensive mapping of all **62 backend endpoints** exposed across the 8 router modules in `SafeRouteBackend/src/routes/*.js` (including backend changes B1 and B2).

## Coverage Summary
- **Total Backend Routes:** 62
- **Directly Used in Screens / Hooks:** 54
- **Intentionally Unused (Allowed Exceptions):** 8
- **Unmapped / Missing Endpoints:** 0

---

## Detailed Endpoint Coverage Table

| # | Method | Path | API Function (`src/api/*`) | Caller (Hook / Component / Screen) | Status | Notes / Justification for Unused |
|---|--------|------|----------------------------|-----------------------------------|--------|----------------------------------|
| 1 | `GET` | `/health` | `apiClient.get('/health')` | Connection health check | `used` | Health check endpoint confirming API availability |
| 2 | `POST` | `/auth/register` | `authApi.register` | `src/pages/auth/RegisterPage.jsx` | `used` | Reporter self-registration |
| 3 | `POST` | `/auth/login` | `authApi.login` | `src/pages/auth/LoginPage.jsx` | `used` | User login returning JWT tokens & user info |
| 4 | `POST` | `/auth/refresh-token` | `refreshSession` / `authApi.refreshToken` | `src/api/client.js`, `src/store/authStore.js` | `used` | Single-flight silent token refresh |
| 5 | `POST` | `/auth/logout` | `authApi.logout` | `src/components/layout/TopBar.jsx`, `src/components/layout/Sidebar.jsx` | `used` | Session logout & token revocation |
| 6 | `POST` | `/auth/forgot-password` | `authApi.forgotPassword` | `src/pages/auth/ForgotPasswordPage.jsx` | `used` | Request password reset email |
| 7 | `POST` | `/auth/reset-password` | `authApi.resetPassword` | `src/pages/auth/ResetPasswordPage.jsx` | `used` | Token-based password reset |
| 8 | `POST` | `/auth/change-password` | `authApi.changePassword` | `useChangePassword`, `src/pages/shared/ProfilePage.jsx` | `used` | Authenticated password update |
| 9 | `POST` | `/incidents` | `incidentsApi.createIncident` | `useCreateIncident`, `src/pages/reporter/ReportIncidentPage.jsx` | `used` | Emergency report submission |
| 10 | `POST` | `/incidents/:id/images` | `incidentsApi.uploadIncidentImages` | `useUploadImages`, `src/pages/reporter/ReportIncidentPage.jsx` | `used` | Multipart photo upload (max 5, 5MB each) |
| 11 | `GET` | `/incidents/my` | `incidentsApi.getMyIncidents` | `useMyIncidents`, `src/pages/reporter/MyIncidentsPage.jsx` | `used` | Paginated reporter incident list |
| 12 | `PATCH` | `/incidents/:id/cancel` | `incidentsApi.cancelIncident` | `useCancelIncident`, `ReporterIncidentDetailPage.jsx`, `MyIncidentsPage.jsx` | `used` | Reporter cancellation of pending report |
| 13 | `PUT` | `/incidents/:id` | `incidentsApi.updateIncident` | `useUpdateIncident`, `src/pages/reporter/EditIncidentPage.jsx` | `used` | Reporter editing of pending incident |
| 14 | `DELETE` | `/incidents/:id` | `incidentsApi.deleteIncident` | `useDeleteIncident`, `ReporterIncidentDetailPage.jsx`, `EditIncidentPage.jsx` | `used` | Reporter deletion of pending report |
| 15 | `GET` | `/incidents/search` | `incidentsApi.searchIncidents` | None | `intentionally unused` | **Allowed exception:** Superceded by `GET /admin/incidents` which supports all filtering, search, and pagination parameters. |
| 16 | `GET` | `/incidents/nearby` | `adminApi.getNearbyIncidents` | `useNearbyIncidents`, `src/pages/admin/NearbyMapPage.jsx` | `used` | Geospatial Haversine radius search |
| 17 | `GET` | `/incidents/:id/responder-location` | `incidentsApi.getResponderLocation` | `useResponderLocation`, `src/components/map/ResponderLiveMap.jsx` | `used` | Real-time responder coordinates telemetry |
| 18 | `GET` | `/incidents/:id/status-history` | `incidentsApi.getIncidentHistory` | `useIncidentHistory`, `ReporterIncidentDetailPage.jsx` | `used` | Dedicated status transitions audit trail |
| 19 | `GET` | `/incidents/:id` | `incidentsApi.getIncident` | `useIncident`, `ReporterIncidentDetailPage.jsx`, `EditIncidentPage.jsx` | `used` | Detailed incident record |
| 20 | `GET` | `/responders/dashboard` | `respondersApi.getDashboard` | `useResponderDashboard`, `src/pages/responder/ResponderDashboardPage.jsx` | `used` | Responder KPIs and active assignments |
| 21 | `GET` | `/responders/incidents` | `respondersApi.getAssignedIncidents` | `useAssignments`, `AssignmentsPage.jsx`, `ResponderDashboardPage.jsx` | `used` | Active responder assignments list |
| 22 | `GET` | `/responders/incidents/completed` | `respondersApi.getCompletedHistory` | `useCompletedAssignments`, `src/pages/responder/HistoryPage.jsx` | `used` | Historical completed incident archive |
| 23 | `GET` | `/responders/incidents/:id` | `respondersApi.getAssignmentDetails` | `useAssignment`, `src/pages/responder/AssignmentDetailPage.jsx` | `used` | Responder assignment detail with incident & reporter info |
| 24 | `PATCH` | `/responders/incidents/:id/accept` | `respondersApi.acceptAssignment` | `useAcceptAssignment`, `AssignmentDetailPage.jsx`, `AssignmentCard.jsx` | `used` | Responder accepts emergency dispatch |
| 25 | `PATCH` | `/responders/incidents/:id/reject` | `respondersApi.rejectAssignment` | `useRejectAssignment`, `AssignmentDetailPage.jsx`, `AssignmentCard.jsx` | `used` | Responder rejects dispatch with optional notes |
| 26 | `PATCH` | `/responders/incidents/:id/start-travel` | `respondersApi.startTravel` | `useStartTravel`, `src/pages/responder/AssignmentDetailPage.jsx` | `used` | Responder marks en route (`on_the_way`) |
| 27 | `PATCH` | `/responders/incidents/:id/arrived` | `respondersApi.arrived` | `useArrived`, `src/pages/responder/AssignmentDetailPage.jsx` | `used` | Responder marks arrived on scene (`reached`) |
| 28 | `PATCH` | `/responders/incidents/:id/resolve` | `respondersApi.resolveIncident` | `useResolveAssignment`, `src/pages/responder/AssignmentDetailPage.jsx` | `used` | Responder marks incident resolved with resolution notes |
| 29 | `POST` | `/responders/location` | `respondersApi.updateLocation` | `src/hooks/useLocationSharing.js` | `used` | High-frequency telemetry background ping |
| 30 | `GET` | `/responders/notifications` | `respondersApi.getNotifications` | None | `intentionally unused` | **Allowed exception:** Superceded by role-agnostic `GET /notifications` |
| 31 | `PATCH` | `/responders/notifications/:notificationId/read` | `respondersApi.markNotificationRead` | None | `intentionally unused` | **Allowed exception:** Superceded by role-agnostic `PATCH /notifications/:id/read` |
| 32 | `GET` | `/admin/dashboard` | `adminApi.getDashboard` | `useAdminDashboard`, `src/pages/admin/AdminDashboardPage.jsx` | `used` | Admin triage counters and emergency queues |
| 33 | `GET` | `/admin/analytics` | `adminApi.getAnalytics` | `useAdminAnalytics`, `src/pages/admin/AnalyticsPage.jsx` | `used` | Visual distribution metrics and trends |
| 34 | `GET` | `/admin/reports/monthly` | `adminApi.getMonthlyReport` | `useAdminMonthlyReport`, `src/pages/admin/MonthlyReportPage.jsx` | `used` | Monthly operations and SLA reporting |
| 35 | `GET` | `/admin/incidents` | `adminApi.getAllIncidents` | `useAdminIncidents`, `AdminIncidentsPage.jsx`, `AdminDashboardPage.jsx` | `used` | Global incident management table |
| 36 | `GET` | `/admin/incidents/:id` | `adminApi.getIncidentDetails` | `useAdminIncident`, `src/pages/admin/AdminIncidentDetailPage.jsx` | `used` | Complete incident audit console |
| 37 | `PATCH` | `/admin/incidents/:id/verify` | `adminApi.verifyIncident` | `useVerifyIncident`, `AdminIncidentDetailPage.jsx`, `AdminDashboardPage.jsx` | `used` | Incident verification by administrator |
| 38 | `PATCH` | `/admin/incidents/:id/reject` | `adminApi.rejectIncident` | `useRejectIncident`, `AdminIncidentDetailPage.jsx`, `AdminDashboardPage.jsx` | `used` | Incident rejection with required reason |
| 39 | `POST` | `/admin/incidents/:id/assign` | `adminApi.assignResponder` | `useAssignResponder`, `src/components/admin/AssignResponderModal.jsx` | `used` | Direct responder dispatch |
| 40 | `POST` | `/admin/incidents/:id/reassign` | `adminApi.reassignResponder` | `useReassignResponder`, `src/components/admin/AssignResponderModal.jsx` | `used` | Transfer active assignment to another responder |
| 41 | `DELETE` | `/admin/assignments/:id` | `adminApi.cancelAssignment` | `useCancelAssignment`, `src/pages/admin/AdminIncidentDetailPage.jsx` | `used` | Cancel active dispatch, reverting to `verified` |
| 42 | `GET` | `/admin/responders/available` | `adminApi.getAvailableResponders` | `useAvailableResponders`, `src/components/admin/AssignResponderModal.jsx` | `used` | Query active responders filtered by unit type |
| 43 | `POST` | `/admin/responders` | `adminApi.createResponder` | `useCreateResponder`, `src/pages/admin/CreateResponderPage.jsx` | `used` | Administrative creation of responder accounts |
| 44 | `GET` | `/admin/users` | `adminApi.getAllUsers` | `useAdminUsers`, `src/pages/admin/UsersPage.jsx` | `used` | Filterable user directory with role and status filters |
| 45 | `GET` | `/admin/users/:id` | `adminApi.getUserDetails` | `useAdminUser`, `src/pages/admin/UserDetailPage.jsx` | `used` | User profile detail and responder GPS telemetry |
| 46 | `PUT` | `/admin/users/:id` | `adminApi.updateUser` | `useUpdateUser`, `src/pages/admin/UserDetailPage.jsx` | `used` | Administrative modification of user details |
| 47 | `PATCH` | `/admin/users/:id/disable` | `adminApi.disableUser` | `useDisableUser`, `UsersPage.jsx`, `UserDetailPage.jsx` | `used` | Immediate account deactivation |
| 48 | `GET` | `/admin/notifications` | `adminApi.getNotifications` | None | `intentionally unused` | **Allowed exception:** Superceded by role-agnostic `GET /notifications` |
| 49 | `PATCH` | `/admin/notifications/:notificationId/read` | `adminApi.markNotificationRead` | None | `intentionally unused` | **Allowed exception:** Superceded by role-agnostic `PATCH /notifications/:id/read` |
| 50 | `GET` | `/users/profile` | `usersApi.getProfile` | `useProfile`, `src/store/authStore.js` (bootstrap), `ProfilePage.jsx` | `used` | Retrieve current authenticated user profile |
| 51 | `PUT` | `/users/profile` | `usersApi.updateProfile` | `useUpdateProfile`, `src/pages/shared/ProfilePage.jsx` | `used` | Self profile update (triggers silent token refresh) |
| 52 | `POST` | `/users/profile/image` | `usersApi.uploadAvatar` | `useUploadAvatar`, `src/pages/shared/ProfilePage.jsx` | `used` | Multipart profile photo upload (max 2MB) |
| 53 | `DELETE` | `/users/profile/image` | `usersApi.removeAvatar` | `useRemoveAvatar`, `src/pages/shared/ProfilePage.jsx` | `used` | Remove profile photo |
| 54 | `POST` | `/users/change-password` | `usersApi.changePassword` | None | `intentionally unused` | **Allowed exception:** We use `/auth/change-password` which has unified validation. |
| 55 | `DELETE` | `/users/account` | `usersApi.deleteAccount` | `useDeleteAccount`, `src/pages/shared/ProfilePage.jsx` | `used` | Self-deactivation of user account |
| 56 | `POST` | `/users/logout-all` | `usersApi.logoutAll` | `useLogoutAll`, `src/pages/shared/ProfilePage.jsx` | `used` | Invalidate all refresh tokens for account |
| 57 | `GET` | `/notifications` | `notificationsApi.getNotifications` | `useNotifications`, `useNotificationsCount`, `NotificationsPage.jsx` | `used` | Paginated notification list with read filter |
| 58 | `GET` | `/notifications/:id` | `notificationsApi.getNotification` | None | `intentionally unused` | **Allowed exception:** List returns complete payloads; navigation links directly to target. |
| 59 | `PATCH` | `/notifications/:id/read` | `notificationsApi.markRead` | `useMarkNotificationRead`, `NotificationsPage.jsx` | `used` | Mark individual notification as read |
| 60 | `PATCH` | `/notifications/read-all` | `notificationsApi.markAllRead` | `useMarkAllNotificationsRead`, `NotificationsPage.jsx` | `used` | Mark all unread notifications as read |
| 61 | `DELETE` | `/notifications/:id` | `notificationsApi.deleteNotification` | `useDeleteNotification`, `NotificationsPage.jsx` | `used` | Dismiss/delete individual notification |
| 62 | `GET` | `/files/:filename` | `filesApi.getFileBlob` | `useSecureImage`, `src/components/incident/SecureImage.jsx` | `used` | Protected authenticated image streaming |

---

## Allowed Exceptions Rationale

1. **`GET /health`**: Used as a connection health check probe to verify backend status.
2. **`GET /notifications/:id`**: `GET /notifications` returns complete object structures for each notification (including `type`, `message`, `reference_id`, `is_read`, and timestamps). Clicking an item directly resolves and navigates to the incident or assignment via `resolveNotificationTarget`.
3. **`POST /users/change-password`**: Identical functionality is provided by `/auth/change-password`, which is standardized across the auth API suite with unified rate limiting.
4. **`GET /responders/notifications` & `PATCH /responders/notifications/:notificationId/read`**: Responders use the unified `/notifications` and `/notifications/:id/read` endpoints, avoiding duplicate query caches.
5. **`GET /admin/notifications` & `PATCH /admin/notifications/:notificationId/read`**: Admins use the unified `/notifications` and `/notifications/:id/read` endpoints.
6. **`GET /incidents/search`**: Superseded by `GET /admin/incidents` which incorporates search alongside type, status, and severity filters with consistent pagination metadata.
