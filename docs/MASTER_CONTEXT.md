# MASTER CONTEXT

## 1. WHAT WE ARE BUILDING

SafeRoute is an emergency reporting and dispatch web app. The BACKEND IS ALREADY BUILT. You are building ONLY the FRONTEND.

Core idea (this drives every screen):
1. A citizen (reporter) registers, logs in and reports an emergency with location, details and photos.
2. An admin verifies the report and assigns a responder (ambulance, police or fire).
3. The responder receives the assignment, sees the emergency location, accepts it, and gets a button that opens Google Maps with directions to the location.
4. The responder travels there, shares live GPS, marks "arrived", then marks the emergency "resolved".
5. The reporter and admin can follow every step (status timeline, notifications, and the responder's live position on a map).

## 2. BACKEND IS THE SOURCE OF TRUTH — CHECK THE BACKEND FOLDER

- Backend folder: `d:/SafeRouteBackend` (if your workspace has it elsewhere, find the folder that contains `src/app.js`, `src/routes/` and `API_REFERENCE.md`).
- Before you build ANY screen, open the backend folder and read the relevant code: `src/routes/*.routes.js`, `src/controllers/*.js`, `src/services/*.js`, `src/validators/*.js`, `src/constants/*.js`.
- Also read `API_REFERENCE.md`, `PROJECT_DOCUMENTATION.md` and (if it exists) `API_RESPONSE_SHAPES.md` in the backend root.
- The docs have small inconsistencies (for example the pagination key may be `meta` or `pagination`, and some list endpoints return the array directly in `data` while others return `data.something`). THE CODE ALWAYS WINS over the docs. If you find a mismatch, follow the code and write the finding into `docs/FRONTEND_NOTES.md` in the frontend project. Do not stop to ask; note it and continue.
- If you are able to run the backend (`npm install`, fill `.env`, `npm run seed`, `npm run dev` on port 5000), use curl to confirm response shapes. If you cannot run it, read the code.
- Never edit backend files in frontend prompts (only the B1, B2 and B3 prompts touch the backend).

## 3. FIXED TECH STACK (do not substitute, do not add other libraries without writing the reason in docs/FRONTEND_NOTES.md)

- Language: plain JavaScript (NO TypeScript). Files are `.jsx` / `.js`.
- React 18 + Vite.
- Tailwind CSS v3.4 (with `tailwind.config.js`, `postcss`, `autoprefixer`). No component library. Build small reusable components yourself.
- Routing: `react-router-dom` v6.
- Server state: `@tanstack/react-query` v5. Client state: `zustand`. HTTP: `axios`.
- Forms: `react-hook-form` + `zod` (v3) + `@hookform/resolvers`.
- Maps: `leaflet` 1.9 + `react-leaflet` v4 + OpenStreetMap tiles. NO Google Maps JS API, no API keys.
- Geocoding (address search and reverse): OpenStreetMap Nominatim (free HTTP API, rules in section 11).
- Charts: `recharts` v2. Icons: `lucide-react`. Toasts: `react-hot-toast`. Dates: `date-fns`.
- Fonts: `@fontsource/inter`.
- Tests (added in the prompts that say so): `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`.
- Only English UI text. No dark mode. No i18n library.
- Frontend project folder: `d:/SafeRouteFrontend` (sibling of the backend). Env file `.env` with `VITE_API_BASE_URL=http://localhost:5000/api/v1`. Also provide `.env.example`.

## 4. FOLDER STRUCTURE (use exactly this)

```
src/
  api/            client.js (axios + interceptors), auth.js, incidents.js, responders.js, admin.js, users.js, notifications.js, files.js
  store/          authStore.js
  hooks/          useDebounce.js, useGeolocation.js, usePageVisible.js, useSecureImage.js, useLocationSharing.js, useNotificationsCount.js
  lib/            constants.js, queryKeys.js, errors.js, format.js, geo.js, maps.js, pagination.js
  components/
    ui/           Button, Input, Textarea, Select, Card, Badge, Modal, ConfirmDialog, Spinner, Skeleton, EmptyState, ErrorState, Pagination, Tabs, FormField, IconButton, Avatar
    layout/       AppShell, Sidebar, BottomNav, TopBar, PageHeader
    map/          MapView, LocationPicker, IncidentMap, ResponderLiveMap, markers.js
    incident/     IncidentCard, StatusBadge, SeverityBadge, TypeIcon, StatusTimeline, ImageGallery, SecureImage
    common/       NotificationBell, RouteLoader, ErrorBoundary
  pages/
    auth/         LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage
    reporter/     ReportIncidentPage, MyIncidentsPage, ReporterIncidentDetailPage, EditIncidentPage
    responder/    ResponderDashboardPage, AssignmentsPage, AssignmentDetailPage, HistoryPage
    admin/        AdminDashboardPage, AdminIncidentsPage, AdminIncidentDetailPage, NearbyMapPage, AnalyticsPage, MonthlyReportPage, UsersPage, UserDetailPage, CreateResponderPage
    shared/       ProfilePage, NotificationsPage, NotFoundPage
  routes/         AppRoutes.jsx, ProtectedRoute.jsx, RoleRoute.jsx
  App.jsx, main.jsx, index.css
docs/             MASTER_CONTEXT.md, FRONTEND_NOTES.md
```

## 5. ROLES AND ROUTES

One web app, role-based routing. After login, redirect by role: reporter → `/reporter/incidents`, responder → `/responder`, admin → `/admin`.

| Route | Who | Page |
|---|---|---|
| `/login`, `/register`, `/forgot-password`, `/reset-password?token=...` | public (logged-in users are redirected to their home) | auth pages |
| `/reporter/report` | reporter | report an emergency |
| `/reporter/incidents` | reporter | my incidents (list) |
| `/reporter/incidents/:id` | reporter | incident detail + timeline + live responder map |
| `/reporter/incidents/:id/edit` | reporter | edit (only while `pending`) |
| `/responder` | responder | dashboard |
| `/responder/assignments` | responder | my assignments |
| `/responder/assignments/:id` | responder | assignment detail (**`:id` is the ASSIGNMENT id, not the incident id**) |
| `/responder/history` | responder | completed assignments |
| `/admin` | admin | dashboard |
| `/admin/incidents`, `/admin/incidents/:id` | admin | triage list and detail |
| `/admin/map` | admin | nearby incidents map |
| `/admin/analytics`, `/admin/reports` | admin | charts and monthly report |
| `/admin/users`, `/admin/users/:id`, `/admin/responders/new` | admin | user management |
| `/profile`, `/notifications` | all logged-in roles (rendered inside the role's own layout) | shared pages |

Responders are NEVER self-registered: only an admin creates them. Admin is created by the backend seed script.

## 6. API CONVENTIONS

- Base URL: `import.meta.env.VITE_API_BASE_URL` (dev: `http://localhost:5000/api/v1`).
- Success envelope: `{ success: true, message, data?, meta? }`. Error envelope: `{ success: false, message, errors?: [{field, message}], errorCode? }`.
- Validation errors are HTTP 422 with `errorCode: "VALIDATION_001"` and a per-field `errors` array. Map `errors[].field` to the matching react-hook-form field with `setError`.
- Request validators are STRICT (zod strict mode): sending an unknown field returns 422. Send ONLY the fields the backend schema lists (for example never send `confirmPassword` to the server).
- Auth header: `Authorization: Bearer <accessToken>` on every protected route.
- Access token lives 15 minutes. Refresh token lives 7 days and is ROTATED on every use (the old one stops working immediately).
- Token storage (decided): access token in memory only (zustand, never persisted). Refresh token in `localStorage` under key `saferoute_refresh_token`.
- 401 handling: on any 401 from a protected request (except `/auth/login` and `/auth/refresh-token`), run ONE shared refresh call (single-flight: all concurrent failed requests wait for the same promise), then retry the original request once. If refresh fails, clear everything and go to `/login`.
- Page load: if a refresh token exists in localStorage, call `/auth/refresh-token` once (guard against React StrictMode running it twice, use a module-level promise), then `GET /users/profile` to load the user, then render. Show a full-page loader meanwhile.
- Profile updates (name/email/phone/avatar change) and password changes invalidate the CURRENT access token on the server. After a profile mutation run a silent refresh and continue. After a password change force logout and send the user to `/login`.
- Rate limits: the backend limits auth endpoints strictly (10 per 15 minutes per IP). The ORIGINAL global limit (100 requests per 15 minutes per IP) is far too low for a polling app, so backend prompt B1 raises it to 1000 per 15 minutes. Still keep requests low: never fetch what you already have, never poll in a hidden tab. On HTTP 429 show a friendly toast ("Too many attempts. Please wait a few minutes.") and never auto-retry 429s.
- Pagination: query `page` (from 1) and `size` (max 100, default 10). Read the response meta defensively through one helper in `src/lib/pagination.js` that accepts either `meta` or `meta.pagination`/`pagination` and returns `{ totalItems, totalPages, currentPage, itemsPerPage }`.
- File uploads: use `FormData`. Do NOT set the `Content-Type` header manually for FormData. Incident photos: field name `images`, max 5 files, 5 MB each. Avatar: field `profile_image`, one file, 2 MB. Allowed types: JPEG, PNG, WebP only.
- Images are PROTECTED. `image_url` values look like `/api/v1/files/<uuid>.jpg` and need the Bearer token, so `<img src>` does NOT work. Always render them through the `SecureImage` component (fetches as a blob via axios, shows object URL, revokes it on unmount, caches per URL).
- Contact fields (`email`, `phone`) are redacted by the backend for non-admins. Every component must tolerate them being missing.
- No WebSockets exist. "Live" features use polling (section 11).

## 7. ENUMS (exact values)

- Roles: `reporter`, `responder`, `admin`.
- Incident type: `road_accident`, `fire`, `medical_emergency`, `flood`, `earthquake`, `crime`, `gas_leak`, `electrical_hazard`, `other`.
- Severity: `low`, `medium`, `high`, `critical` (default `medium`).
- Incident status: `pending`, `verified`, `assigned`, `accepted`, `on_the_way`, `reached`, `resolved`, `rejected`, `cancelled`.
- Assignment status: `assigned`, `accepted`, `rejected`, `completed`.
- Responder type: `ambulance`, `police`, `fire`.
- Terminal statuses (stop polling): `resolved`, `rejected`, `cancelled`.

Put all of these in `src/lib/constants.js` with human labels (for example `on_the_way` → "On the way").

## 8. STATUS WORKFLOW (what the UI must allow)

```
pending ──admin verify──▶ verified ──admin assign──▶ assigned ──responder accept──▶ accepted
   │                         │                          │ ▲                            │
   │ admin reject            │ reporter cancel          │ │ responder reject           │ start-travel
   ▼                         ▼                          ▼ │ (back to verified)         ▼
rejected                 cancelled                  verified                      on_the_way ──arrived──▶ reached ──resolve──▶ resolved
```

- Reporter: edit/delete only while `pending`. Cancel while `pending` or `verified`.
- Admin: verify/reject only `pending`. Assign only `verified`. Reassign or cancel-assignment while `assigned` or `accepted`.
- Responder: accept/reject only when assignment is `assigned`; start-travel only when `accepted`; arrived only when `on_the_way`; resolve only when `reached`.
- Buttons that are not valid for the current state must NOT be rendered (do not just disable them).

## 9. ENDPOINT CHEAT SHEET (all paths are relative to the base URL)

**Public / auth**
- `POST /auth/register` `{full_name(2-100), email, phone(10-20), password(12-128)}` → `data.user`
- `POST /auth/login` `{email, password}` → `data.{user, accessToken, refreshToken}`
- `POST /auth/refresh-token` `{refreshToken}` → `data.{accessToken, refreshToken}`
- `POST /auth/logout` `{refreshToken}`
- `POST /auth/forgot-password` `{email}` (always the same message)
- `POST /auth/reset-password` `{token, newPassword(12-128)}`
- `POST /auth/change-password` (auth) `{currentPassword, newPassword(12-128)}`

**Reporter (incidents)**
- `POST /incidents` `{title(5-200), description(>=10), incident_type, severity?, latitude, longitude, address?(<=500)}`
- `POST /incidents/:id/images` multipart `images`
- `GET /incidents/my?page&size&status`
- `PATCH /incidents/:id/cancel`, `PUT /incidents/:id` (all fields optional), `DELETE /incidents/:id`

**Shared incident reads**
- `GET /incidents/:id` (admin, owner reporter, assigned responder)
- `GET /incidents/:id/status-history`
- `GET /incidents/:id/responder-location` (NEW, added by backend prompt B2; owner reporter and admin) → `data.location` = `{ responder: {id, full_name, responder_type}, latitude, longitude, updated_at }` or `data.location = null` when no live position is known yet. If this endpoint returns 404 (backend prompt B2 not applied yet) the UI hides the live-map block and shows nothing, without an error toast.

**Admin-only incident reads**
- `GET /incidents/search`, `GET /incidents/nearby?latitude&longitude&radius(km, max 100, default 5)`

**Responder** (`:id` = assignment id)
- `GET /responders/dashboard`
- `GET /responders/incidents?page&size&status`, `GET /responders/incidents/completed?page&size`
- `GET /responders/incidents/:id`
- `PATCH /responders/incidents/:id/accept`, `/reject` `{notes?}`, `/start-travel`, `/arrived`, `/resolve` `{notes?}`
- `POST /responders/location` `{latitude, longitude}`

**Admin**
- `GET /admin/dashboard`, `GET /admin/analytics`, `GET /admin/reports/monthly?year&month`
- `GET /admin/incidents?page&size&status&incident_type&severity&search`, `GET /admin/incidents/:id`
- `PATCH /admin/incidents/:id/verify`, `PATCH /admin/incidents/:id/reject` `{reason?(>=5 chars)}`
- `POST /admin/incidents/:id/assign` `{responder_id}`, `POST /admin/incidents/:id/reassign` `{responder_id}`
- `DELETE /admin/assignments/:assignmentId`
- `GET /admin/responders/available?responder_type`
- `POST /admin/responders` `{full_name, email, phone, password, responder_type}`
- `GET /admin/users?page&size&role&search&is_active`, `GET /admin/users/:id`, `PUT /admin/users/:id` `{full_name?, email?, phone?, is_active?, responder_type?}`, `PATCH /admin/users/:id/disable`

**Users (any role)**
- `GET /users/profile`, `PUT /users/profile` `{full_name?, email?, phone?}`
- `POST /users/profile/image` (multipart `profile_image`), `DELETE /users/profile/image`
- `DELETE /users/account` (deactivates own account), `POST /users/logout-all`
- (`POST /users/change-password` exists but we use `/auth/change-password` instead.)

**Notifications (any role, use ONLY these; do not use the role-specific copies under /responders and /admin)**
- `GET /notifications?page&size&is_read`, `GET /notifications/:id`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`, `DELETE /notifications/:id`

**Files / system**
- `GET /files/:filename` (Bearer required, returns binary), `GET /health`

## 10. DESIGN SYSTEM — "soft, simple, pastel"

Feeling: calm, friendly, uncluttered, even though the topic is emergencies. Lots of white space, rounded shapes, soft shadows, light borders. Never harsh red blocks or heavy dark backgrounds. Light mode only.

Tailwind theme tokens (put them in `tailwind.config.js`, use only these, no random hex values in components):

```
colors.primary: 50 #F3F5FF, 100 #E6EAFF, 200 #CDD5FF, 300 #AEB9FB, 400 #8E9BF5, 500 #6F7EEA, 600 #5766D6, 700 #4552B8
colors.surface: page #F8F8FD, card #FFFFFF, muted #F1F1F8
colors.line: #E6E7F2
colors.ink: DEFAULT #2B2F45, soft #5B6079, faint #8A8FA8
colors.pastel (bg / text pairs):
  mint   bg #DDF5EA  text #1F6B4F
  sky    bg #DCEEFB  text #1D5A8A
  lavender bg #E9E4FA text #503E93
  peach  bg #FFE8D9  text #9A4B1F
  butter bg #FFF3CF  text #7A5A00
  rose   bg #FFE0E6  text #A02B45
  slate  bg #ECEEF4  text #4A5068
borderRadius: xl 0.9rem, 2xl 1.25rem (use rounded-2xl for cards and modals, rounded-xl for inputs and buttons)
boxShadow.soft: 0 6px 24px -8px rgba(87,102,214,0.18)
fontFamily.sans: Inter, system-ui, sans-serif
```

Status badge colors: pending=butter, verified=sky, assigned=lavender, accepted=mint, on_the_way=peach, reached=sky, resolved=mint, rejected=rose, cancelled=slate.
Severity badge colors: low=mint, medium=butter, high=peach, critical=rose.

Rules:
- Primary buttons: `bg-primary-600 text-white hover:bg-primary-700 rounded-xl`, min height 44px. Secondary: white with `border-line`. Danger (reject, delete, cancel): `bg-pastel-rose-bg text-pastel-rose-text` soft style, with a confirmation dialog.
- Cards: white, `rounded-2xl shadow-soft border border-line p-4 md:p-6`.
- Page background `bg-surface-page`. Max content width 1200px centered on desktop.
- Visible focus rings (`focus-visible:ring-2 ring-primary-300`). All icon-only buttons need `aria-label`. All inputs need labels. Text contrast must stay readable (use `ink` for body text).
- Layout: desktop (>= 1024px) = left sidebar (white, collapsible) + top bar. Mobile (< 1024px) = top bar + bottom navigation for reporter and responder (4 items max), hamburger drawer for admin. Tap targets at least 44px.
- Every data screen must have: loading skeleton, empty state (friendly icon + sentence + action), error state (message + Retry button).
- Use `lucide-react` icons. Type icons: fire=Flame, road_accident=Car, medical_emergency=HeartPulse, flood=Waves, earthquake=Activity, crime=ShieldAlert, gas_leak=Wind, electrical_hazard=Zap, other=AlertCircle.

## 11. BEHAVIOUR DECISIONS (already made, just implement)

**Polling** (TanStack Query `refetchInterval`, always with `refetchIntervalInBackground: false`, and paused when the tab is hidden; the hook `usePageVisible` exposes visibility):
- Unread notification count (bell badge): every 45 s, one request only: `GET /notifications?is_read=false&size=1`, read the total from the pagination meta.
- Reporter incident detail: `GET /incidents/:id` every 20 s while the incident is not terminal. The status history (`/status-history`) is NOT polled: fetch it once, and refetch it only when the polled incident `status` value changes. The responder location (`/incidents/:id/responder-location`) is polled every 15 s ONLY while status is `accepted`, `on_the_way` or `reached`.
- Responder assignments list and assignment detail: every 30 s.
- Admin dashboard and the pending-incidents panel: every 30 s. Admin incident detail: every 30 s while not terminal; admin live responder map: every 15 s only while the incident is `accepted`, `on_the_way` or `reached`.
- Global query defaults: `staleTime: 20_000`, `refetchOnWindowFocus: false`, `retry`: no retry on 4xx, 1 retry otherwise.
- If a request returns 429, pause all polling for 60 seconds.

**Responder live location sharing** (hook `useLocationSharing`, mounted once inside the responder layout):
- Active only while the responder has at least one assignment with status `accepted` (incident `accepted`, `on_the_way` or `reached`).
- Sends `POST /responders/location` immediately when sharing starts, then every 30 seconds, using `navigator.geolocation.getCurrentPosition` in a timer (not `watchPosition`, to save battery and requests). Also sends once when the tab becomes visible again and right after each progress action.
- Shows a small status chip in the layout: "Sharing live location · last sent 12s ago", or "Location off: allow location access" when permission is denied, plus a manual "Update now" button.
- Tell the responder once (a hint under the chip) that the page must stay open for live sharing.
- Geolocation only works on HTTPS or `localhost`. Mention this in docs/FRONTEND_NOTES.md.

**Google Maps button (core requirement)**: on the responder's assignment detail and on the assignment card, show a prominent button "Open in Google Maps" that opens in a new tab (`target="_blank" rel="noopener noreferrer"`):
`https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>&travelmode=driving`
Build it in `src/lib/maps.js` as `googleMapsDirectionsUrl(lat, lng)`. Also offer a secondary "View pin" link: `https://www.google.com/maps/search/?api=1&query=<lat>,<lng>`. Latitude and longitude may come back from the API as strings (MySQL DECIMAL): always convert with `Number()`.

**Maps (Leaflet)**:
- Tiles: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`, attribution `© OpenStreetMap contributors` must be visible.
- Fix the Leaflet default marker icon problem with Vite by using custom `L.divIcon` pastel pins in `components/map/markers.js` (do not rely on the default image icons).
- Import `leaflet/dist/leaflet.css`. Give every map container an explicit height.
- Fallback map center when geolocation is denied: latitude 20.5937, longitude 78.9629, zoom 5.

**Nominatim (address search + reverse geocoding)**:
- Search: `https://nominatim.openstreetmap.org/search?format=jsonv2&q=<text>&limit=5&addressdetails=1&accept-language=en`
- Reverse: `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=<lat>&lon=<lng>&accept-language=en`
- Usage rules: debounce typing by 700 ms, minimum 3 characters, at most 1 request per second, cache results by query in memory, cancel in-flight requests (AbortController). Never call it on every map drag frame; only on drag end. Handle failures silently (the user can still type the address manually).

## 12. CODING RULES (read twice)

1. Do exactly what the prompt says. Do not redesign. Do not rename files or routes. Do not add pages, features or libraries that were not requested.
2. One responsibility per file. API calls only in `src/api/*`, never inside components. Components use React Query hooks that wrap those functions.
3. All query keys come from `src/lib/queryKeys.js`. After every mutation invalidate exactly the affected keys.
4. Every form uses react-hook-form + zod, shows inline field errors, disables the submit button while submitting, and shows a toast on success or failure. Failure toasts use the backend `message`.
5. Never `console.log` secrets or tokens. Never store the access token anywhere except the zustand store memory.
6. Destructive actions (delete, cancel, reject, disable, logout all, delete account) always use `ConfirmDialog`.
7. No placeholder or lorem ipsum data, no hard-coded mock data. Everything comes from the API.
8. Keep components small (under about 200 lines). Extract sub-components instead of building giant pages.
9. After finishing, run `npm run build` and `npm run lint` (if configured) and fix every error before reporting done. Then give a short summary: files created, any mismatch found between docs and code, and anything you could not finish.
10. If something in this context conflicts with the backend CODE, follow the backend code, write one line in `docs/FRONTEND_NOTES.md`, and continue.

## 12b. BACKEND CHANGES THE FRONTEND DEPENDS ON (prompts B1, B2, B3 run BEFORE the frontend prompts)

- B1: global rate limit raised; admins get a notification when a new incident is reported; the assigned responder can see the reporter's name AND phone once the assignment is accepted; optional demo seed.
- B2: responder live location endpoint for reporter and admin; location updates no longer bump `users.updated_at` (otherwise every GPS ping would revoke the responder's own access token).
- B3: writes `API_RESPONSE_SHAPES.md` in the backend root listing the real response JSON of every endpoint. If this file exists, use it as the primary reference for shapes.
- Notification types known from the docs: incident verified, rejected, assigned, accepted, on the way, reached, resolved, assignment rejected, and (after B1) new incident reported. Notification fields: `id, user_id, title, message, type, reference_id (incident id), is_read, created_at`. Clicking a notification should mark it read and navigate to the matching incident page for the user's role using `reference_id` (verify in code whether `reference_id` is an incident id or an assignment id for responder notifications; for responders the link target must be the ASSIGNMENT page, so if only the incident id is known, look up the assignment via the assignments list).

## 13. DEV TEST ACCOUNTS

Admin comes from the backend seed script (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in the backend `.env`, examples in the docs: `admin@example.com` / `AdminSecurePass123!`).
Prompt B1 optionally adds `npm run seed:demo` to the backend, which creates (development only):
- Reporter: `reporter@example.com` / `ReporterPass123!`
- Responders: `ambulance@example.com`, `police@example.com`, `fire@example.com`, all with password `ResponderPass123!`
Never hard-code these in the frontend source. Only mention them in `README.md` under "Development accounts".
