# SafeRoute Frontend Implementation Notes

This document logs runtime decisions, backend code findings, and differences between preliminary documentation and actual backend code.

## 1. Backend Code Truths & Deviations from Preliminary Docs

1. **Timestamp Key Casing (`createdAt` / `updatedAt`):**
   - Backend Sequelize models serialize model timestamps in camelCase: `createdAt` and `updatedAt` (not snake_case `created_at` / `updated_at`).
   - Exception: Raw SQL in Haversine query (`GET /incidents/nearby`) returns snake_case `created_at` and `updated_at`.
   - The frontend normalizes and handles both gracefully.

2. **Pagination Envelope Structure:**
   - All paginated endpoints return `data: [...]` (direct array) with `meta` at the top level:
     `{ success: true, message: "...", data: [...], meta: { totalItems, totalPages, currentPage, itemsPerPage } }`.
   - There is no `meta.pagination` nesting, and `data` is never `{ items: [...] }`.
   - `readPagination` and `readList` in `src/lib/pagination.js` defensively handle all variants.

3. **Incident Types Canonical Enum:**
   - The emergency medical type is strictly `"medical_emergency"`, not `"medical"`. Submitting `"medical"` returns HTTP 422 `VALIDATION_001`.

4. **Notification `reference_id` Mapping:**
   - Every notification in the backend stores the **incident ID** in `reference_id` (even for `assignment_rejected`).
   - Responders navigating from a notification to their assignment detail resolve the assignment ID via the active assignments list.

5. **Coordinates Representation:**
   - `latitude` and `longitude` are returned as strings (MySQL `DECIMAL`) across most endpoints.
   - Exception: `GET /incidents/:id/responder-location` casts them to numbers via `Number()`.
   - `src/lib/geo.js` and `src/lib/maps.js` use safe `toNumber()` to ensure numbers are always passed to Leaflet, Google Maps, and math helpers.

6. **Multipart Form Field Names:**
   - Incident image uploads require repeated field name `images` (max 5, up to 5 MB each).
   - Profile avatar upload requires single field name `profile_image` (max 1, up to 2 MB).

7. **Token Revocation on Profile Mutation:**
   - Updating user profile (`PUT /users/profile`), uploading avatar (`POST /users/profile/image`), or removing avatar (`DELETE /users/profile/image`) advances `user.updated_at`, which revokes the existing JWT access token.
   - The frontend triggers a silent session refresh after profile mutations to keep the user authenticated smoothly.
   - Password changes trigger an explicit session clear and redirect to `/login`.

8. **Geolocation Security Requirement:**
   - `navigator.geolocation` APIs require HTTPS or `localhost`.

## 2. Authentication Pages (Prompt F1) Notes

1. **Login Password Validation vs Register Validation:**
   - `LoginPage` intentionally does not enforce a 12-character minimum on the client (only `min(1)`), allowing older accounts and the seeded admin (`admin@saferoute.com` with password `admin123`) to authenticate without being blocked by client-side validation.
   - `RegisterPage` enforces the full 12–128 character password rule via Zod schema and live visual checklist.
2. **Phone Number Sanitization:**
   - Phone inputs accept user-entered spaces and hyphens (e.g. `98765-43210` or `+1 555-123-4567`). Spaces and hyphens are stripped prior to submitting payload to the strict backend schema.
3. **Registration 409 Conflict Field Targeting:**
   - Backend returns HTTP 409 with `{ message: "Email already registered" }` or `{ message: "Phone number already registered" }`. The frontend maps these directly to `setError('email')` or `setError('phone')` respectively.
4. **Live Password Rule Checklist:**
   - Implemented using `useWatch` from `react-hook-form` to track field state cleanly without causing re-renders of the entire form.

## 3. Reporter Experience & Maps (Prompt F2) Notes

1. **Two-Step Report Submission Flow:**
   - Step 1 creates the incident (`POST /incidents`) with JSON `{ title, description, incident_type, severity, latitude, longitude, address? }`.
   - Step 2 uploads photos if any (`POST /incidents/:id/images`).
   - If Step 1 succeeds and Step 2 fails, the incident is never re-created. The UI displays an alert allowing the user to "Retry photo upload" or "Continue without photos".
2. **IncidentForm Extraction & Dirty Diffing:**
   - Reusable `IncidentForm` extracted to `src/components/incident/IncidentForm.jsx` shared between `ReportIncidentPage` and `EditIncidentPage`.
   - `EditIncidentPage` performs shallow diffing against loaded values and submits only changed fields in `PUT /incidents/:id`. If no fields changed, the API call is skipped and a toast notification notifies the user.
3. **Responder Privacy Constraints on Detail Page:**
   - When viewing an assigned incident, reporters receive only the responder's `{ id, full_name, responder_type }`. Contact numbers and emails are stripped by the backend `serializeIncident` and the UI handles missing fields cleanly.
4. **Rejection Reason Resolution:**
   - Rejection reasons are recorded in `StatusTimeline` history notes (`new_status === 'rejected'`) and extracted on `ReporterIncidentDetailPage` to explain administrative rejection to the reporter.
5. **Debounced Place Search & Throttling:**
   - `LocationPicker` integrates with `lib/nominatim.js`, throttling queries to at most 1 per second with 700ms debounce, in-memory caching, and AbortController cancellation.

## 4. Responder Experience (Prompt F3) Notes

1. **Assignment ID vs Incident ID Routing & API Boundaries:**
   - All responder incident endpoints (`/responders/incidents/:id/...`) take the **ASSIGNMENT id**, never the incident id.
   - Frontend routes (`/responder/assignments/:id`) and queries (`qk.responder.assignment(id)`) strictly use the assignment id.
2. **Notification Reference ID Resolution:**
   - Backend notifications carry `reference_id` pointing to the `incident.id`. Responders clicking a notification use `resolveNotificationTarget(user, notification, queryClient)` to map the incident id to their active assignment id. If not found in cache, it redirects to `/responder/assignments`.
3. **Strict 6-State Action Matrix:**
   - State 1: `assigned` / `assigned` -> Accept and Reject buttons.
   - State 2: `accepted` / `accepted` -> Start travel button.
   - State 3: `accepted` / `on_the_way` -> I have arrived button.
   - State 4: `accepted` / `reached` -> Mark as resolved button.
   - State 5: `completed` / `resolved` -> Read-only completed state with resolution timestamp.
   - State 6: `rejected` / `any` -> Read-only inactive banner.
4. **Reject and Resolve Mutation Payloads:**
   - The Reject and Resolve modals trim optional notes. If empty, `notes` is omitted from the request body (`{}`), ensuring backend validation rules are satisfied without sending empty strings.
5. **Background Location Sharing (`useLocationSharing`):**
   - Actively pings `POST /responders/location` every 30 seconds while at least one `accepted` assignment exists.
   - Pings immediately when an assignment becomes accepted, when the page becomes visible, or when travel/arrived/resolve mutations succeed (via `saferoute:send-location` event).
   - Pauses location updates when the browser tab is hidden and automatically resumes when the user switches back.
   - Automatically backs off for 60 seconds if rate limit HTTP 429 is encountered.
6. **Reporter Contact & Privacy Protection:**
   - Reporter email is never exposed in responder serializers. Reporter phone is only exposed once the assignment is accepted (`assignment_status !== 'assigned'`).
7. **Numeric Coordinate Safety:**
   - All latitudes and longitudes from API responses and URL params are coerced to numbers via `toNumber()` before passing to Leaflet, Google Maps, or Haversine distance calculations.
8. **Auto-refresh and Fast Invalidation on Stale State:**
   - Stale state transitions (HTTP 400 `INCIDENT_002`, HTTP 403, or HTTP 404) trigger immediate query invalidation to re-sync the assignment to its current server state.

## 5. Admin Area (Prompt F4) Notes

1. **Triage Action Matrix & Terminal State Locks:**
   - `pending`: Verify (`PATCH /admin/incidents/:id/verify`) & Reject modal (`PATCH /admin/incidents/:id/reject`). Reason requires >= 5 chars if provided; omitted (`{}`) if empty.
   - `verified`: Assign responder button opens `AssignResponderModal`.
   - `assigned` or `accepted`: Reassign responder (`PATCH /admin/assignments/:assignmentId/reassign`) & Cancel assignment (`DELETE /admin/assignments/:assignmentId`).
   - `on_the_way` or `reached`: Informational note displayed; mutation actions locked while responder is actively in transit / on-site.
   - `resolved`, `rejected`, `cancelled`: Read-only terminal states.
2. **Numeric `responder_id` Requirement:**
   - Backend validator strictly enforces numeric `responder_id` for `assignResponder` and `reassignResponder`. The frontend explicitly casts values using `Number(id)`.
3. **Smart Responder Matching & Proximity Ranking:**
   - Incident type automatically pre-selects the optimal responder type category in `AssignResponderModal`:
     `medical_emergency` / `road_accident` -> `ambulance`, `crime` -> `police`, `fire` / `gas_leak` / `electrical_hazard` / `flood` / `earthquake` -> `fire`.
   - Responders are sorted in real-time by Haversine distance ascending from the incident coordinates; responders without known GPS coordinates are grouped cleanly at the end.
4. **MySQL String Aggregate Handling in Analytics & Reports:**
   - MySQL `COUNT(*)` and `SUM()` aggregates return strings (e.g. `'12'`). All metrics in `AnalyticsPage` and `MonthlyReportPage` are strictly cast with `Number(x || 0)` to prevent string concatenation or NaN bugs.
   - In `MonthlyReportPage`, resolution rate is computed with a divide-by-zero guard: `total > 0 ? ((resolved / total) * 100).toFixed(1) : '0.0'`.
5. **Chronological Monthly Trend Ordering:**
   - `GET /admin/analytics` returns `monthlyTrend` ordered `DESC` (most recent month first). The frontend reverses this array to render charts chronologically from left to right.
6. **Recharts Theming & Accessible Data Summaries:**
   - All Recharts graphs (`AnalyticsPage`) use the custom Tailwind pastel palette (`primary-500`, `pastel-mint`, `pastel-butter`, `pastel-peach`, `pastel-rose`) instead of default browser colors.
   - Screen-reader accessible summary descriptions accompany every chart.
7. **Strict User Editing & Self-Protection:**
   - `PUT /admin/users/:id` validates strictly. Shallow diffing against loaded user state ensures only dirty fields are submitted.
   - Self-deactivation and deactivating already inactive accounts are guarded against both visually and programmatically.
8. **Boolean Query Parameter Handling for Admin Users List:**
   - `GET /admin/users` parses `is_active` as string values (`'true'` or `'false'`). Frontend query serialization maps active filter states to these literal strings.
9. **Nearby Incidents Map & Nominatim Debounce:**
   - `NearbyMapPage` features an interactive 1–100 km radius slider debounced at 500ms, center place geocoding via Nominatim with rate limiting, and an overlay circle visualizing coverage radius.

## 6. Verification, Polish & Bug Fixes (Prompt F6) Notes

1. **Query Parameter Naming in Pagination (`size` vs `limit`):**
   - Backend `incidentQuerySchema` in `src/validators/incident.validator.js` uses `.strict()` and only accepts `page` and `size`. Passing `limit` triggers an HTTP 422 `VALIDATION_001` error.
   - `MyIncidentsPage.jsx` was aligned to pass `size: PAGE_SIZE_DEFAULT`, resolving the 422 error.

2. **Constants Export Integrity:**
   - Added missing helper constants `sanitizePhone`, `ROLE_BADGE_META`, and `RESPONDER_TYPE_META` to `src/lib/constants.js`.

3. **React Rules of Hooks in RoleRoute:**
   - In `RoleRoute.jsx`, early returns for booting state were moved after the `useEffect` hook, eliminating conditional hook execution warnings.

4. **Query Key Definition for Profile:**
   - Added `users: { profile: ['profile'] }` to `src/lib/queryKeys.js` to support `useUser.js` hooks.

5. **Leaflet Infinite Tile Calculation in Headless Containers:**
   - In `MapView.jsx`, Leaflet was attempting to calculate infinite tile bounds when rendered inside headless or flex containers. Added explicit `minZoom={1}`, `maxZoom={19}`, and default `style={{ minHeight: '280px' }}` to `MapContainer`, preventing tile coordinate calculation errors.




