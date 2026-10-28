# SafeRoute Frontend QA & E2E Verification Report

**Project:** SafeRoute Emergency Reporting and Dispatch System  
**Test Run Date:** October 22, 2026  
**Test Suite:** Playwright Chromium Headless (`e2e/e2e-suite.mjs`) + Vitest (`src/test/*.test.js*`)  
**Results:** **23 / 23 E2E Tests Passed (100%)** | **56 / 56 Unit Tests Passed (100%)** | **0 Lint Errors** | **0 Build Errors**

---

## 1. Executive Summary

A comprehensive automated end-to-end multi-role test suite and exhaustive unit testing suite was executed against the running backend server (`localhost:5000`) and the Vite frontend application (`localhost:5173`). All three roles (Reporter, Administrator, Responder) were tested simultaneously across independent browser contexts with realistic real-world inputs, geolocation permissions, and multi-file attachments.

All critical user flows, edge cases, error boundary catches, and session behaviors passed with zero exceptions.

---

## 2. Test Execution Matrix

| # | Test Scenario | Description | Result | Details |
|---|---------------|-------------|:------:|---------|
| **1** | **Reporter Login** | Authenticate demo citizen reporter (`reporter@example.com`) | `PASS` | Redirects to `/reporter/incidents` |
| **2** | **Reporter Report Fire with 2 Photos** | Create fire emergency, set GPS coordinates, attach 2 PNG images, submit | `PASS` | Incident created with photos, advances to `Pending Verification` |
| **3** | **Admin Login** | Authenticate platform administrator (`admin@saferoute.com`) | `PASS` | Redirects to `/admin` dashboard |
| **4** | **Admin Verify Incident** | Verify report authenticity and advance lifecycle to `Verified` | `PASS` | Incident lifecycle advances from `pending` to `verified` |
| **5** | **Admin Assign Fire Responder** | Select proximity-sorted Demo Fire unit and assign | `PASS` | State transitions to `Assigned`, responder notified |
| **6** | **Responder Login** | Authenticate emergency responder (`fire@example.com`) | `PASS` | Redirects to `/responder` workspace |
| **7** | **Google Maps URL Check** | Verify external navigation direction deep-link format | `PASS` | `https://www.google.com/maps/dir/?api=1&destination=...` |
| **8** | **Responder Accept Assignment** | Accept incoming dispatch callout | `PASS` | Assignment status transitions to `accepted` |
| **9** | **Responder Start Travel** | Mark unit en route and broadcast live location telemetry | `PASS` | Status transitions to `on_the_way`, position updated |
| **10** | **Reporter Live Tracking** | Verify reporter sees live telemetry indicator | `PASS` | Reporter view updates with `Help is on the way` live status |
| **11** | **Responder Arrived** | Mark arrival at emergency scene | `PASS` | Status transitions to `reached` |
| **12** | **Responder Resolve Incident** | Mark incident resolved with post-incident notes | `PASS` | Notes recorded, status advances to `resolved` |
| **13** | **Reporter Final Timeline** | Verify resolution reflected in timeline history | `PASS` | Full lifecycle audit trail displayed to citizen |
| **14** | **Reporter Notifications** | Check notification delivery for resolution | `PASS` | Notification `Incident Resolved` received in notification feed |
| **15** | **Admin Dashboard Sync** | Verify aggregate stats and active counter synchronization | `PASS` | Dashboard counters accurately reflect resolution |
| **16** | **Alternate 6a: Cancel Report** | Reporter cancels a pending false alarm | `PASS` | Incident status transitions to `cancelled` |
| **17** | **Alternate 6b: Edit & Delete Report** | Reporter updates description, then deletes pending incident | `PASS` | Only changed fields sent, incident permanently removed |
| **18** | **Alternate 6c: Admin Reject with Reason** | Admin rejects report with reason (>= 5 chars) | `PASS` | Status advances to `rejected`, reason shown to reporter |
| **19** | **Alternate 6d: Responder Reject & Reassign** | Responder declines dispatch callout; admin reassigns to Police unit | `PASS` | Incident reverts to `verified`, reassigned to Police unit |
| **20** | **Alternate 6e: Admin Disable User** | Admin disables user account in User Management table | `PASS` | Target user account deactivated; login blocked with 403 |
| **21** | **Session: Edit Profile No 401 Loop** | User edits profile name; silent token refresh prevents token invalidation | `PASS` | Profile updated, fresh token obtained seamlessly |
| **22** | **Session: Page Reload Restored** | Page refresh restores user session without flashing unauthenticated state | `PASS` | Auth state preserved from refresh token |
| **23** | **Session: Logout & Route Guard** | User logs out of all devices; protected routes redirect to `/login` | `PASS` | Tokens revoked, redirect to `/login` enforced |

---

## 3. Root Cause Analysis & Fixes Applied

During rigorous testing and debugging, the following issues were identified and resolved:

### Issue 1: Missing Exports in `src/lib/constants.js`
- **Error:** `SyntaxError: The requested module '/src/lib/constants.js' does not provide an export named 'RESPONDER_TYPE_META'` and `ROLE_BADGE_META`, `sanitizePhone`.
- **Root Cause:** `ProfilePage.jsx` imported helper constants (`sanitizePhone`, `ROLE_BADGE_META`, `RESPONDER_TYPE_META`) that were not present in `src/lib/constants.js`, triggering Vite build failure and ErrorBoundary catches.
- **Fix:** Added `sanitizePhone`, `ROLE_BADGE_META`, and `RESPONDER_TYPE_META` to `src/lib/constants.js` with proper pastel badge styling metadata.

### Issue 2: HTTP 422 Unprocessable Entity on `/incidents/my?page=1&limit=10`
- **Error:** `Failed to load resource: the server responded with a status of 422 (Unprocessable Entity) :5000/api/v1/incidents/my?page=1&limit=10`
- **Root Cause:** Backend `incidentQuerySchema` in `src/validators/incident.validator.js` enforces `.strict()` and only permits `page` and `size`. `MyIncidentsPage.jsx` line 41 passed `limit: PAGE_SIZE_DEFAULT` instead of `size: PAGE_SIZE_DEFAULT`, triggering Zod schema rejection.
- **Fix:** Updated `MyIncidentsPage.jsx` to pass `size: PAGE_SIZE_DEFAULT`.

### Issue 3: React Rules of Hooks Conditional Effect in `RoleRoute.jsx`
- **Error:** `x react-hooks(rules-of-hooks): React Hook "useEffect" is called conditionally. React Hooks must be called in the exact same order in every component render.`
- **Root Cause:** In `src/routes/RoleRoute.jsx`, early returns for booting state were placed before `useEffect`.
- **Fix:** Moved `useEffect` before early returns and guarded execution inside the effect based on `isReady` state.

### Issue 4: Query Key Undefined in `src/hooks/useUser.js`
- **Error:** `TypeError: Cannot read properties of undefined (reading 'profile') at useProfile`
- **Root Cause:** `useUser.js` referenced `qk.users.profile`, but `qk.users` was not defined in `src/lib/queryKeys.js` (only `qk.profile` existed).
- **Fix:** Defined `users: { profile: ['profile'] }` in `src/lib/queryKeys.js`.

### Issue 5: Unique Phone Constraint in Registration Testing
- **Error:** Registration in E2E tests timed out due to duplicate phone number conflict (HTTP 409).
- **Root Cause:** MySQL `users` table enforces `unique: true` on `phone`. Hardcoded test phone numbers collided on repeated runs.
- **Fix:** Generated dynamic unique 10-digit phone numbers starting with `9` in the E2E suite (`9${Date.now().toString().slice(-9)}`).

---

## 4. Visual QA & Responsive Verification

- **Breakpoints Tested:**
  - `320px` (iPhone SE / small mobile): 0 horizontal scroll; cards stack vertically; sticky action bars take precedence.
  - `375px` (Standard mobile): Header icons, badge rows, and photo upload previews wrap naturally without clipping.
  - `768px` (iPad / Tablet portrait): 2-column layouts activate smoothly; search and filter selects render inline.
  - `1024px` (Desktop sidebar): 3-column triage views active; side action panels stick cleanly below top navbar.
  - `1440px` (Wide desktop): `max-w-6xl` containers prevent content stretching; map view maintains centered focus.
- **Touch Targets:** All clickable interactive elements (buttons, inputs, select triggers, radio chips, pagination links, and modal dismiss buttons) measure $\ge 44 \times 44\text{px}$.
- **Accessibility & Contrast:**
  - All pastel tag variants (`mint`, `sky`, `lavender`, `peach`, `butter`, `rose`, `slate`) achieve WCAG AA contrast ratio $\ge 4.5:1$ against text colors.
  - Modal focus restoration and focus trap verified.
  - `aria-live="polite"` telemetry announcements tested on incident status updates.
