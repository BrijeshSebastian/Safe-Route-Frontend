# SafeRoute Frontend

SafeRoute is a modern emergency incident reporting and responder dispatch web application built with React, Vite, Tailwind CSS, Leaflet, and TanStack Query.

## Prerequisites

- Node.js (v18+ or v20+)
- SafeRouteBackend running on `http://localhost:5000`

## Getting Started

1. Clone or navigate to the frontend directory:
   ```bash
   cd SafeRouteFrontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   Variables:
   - `VITE_API_BASE_URL`: Base URL for the SafeRoute backend API (default: `http://localhost:5000/api/v1`).

4. Run the development server (runs on port 5173):
   ```bash
   npm run dev
   ```

5. Run unit tests:
   ```bash
   npm test
   ```

6. Run end-to-end browser test suite (requires dev servers running):
   ```bash
   node e2e/e2e-suite.mjs
   ```

7. Build for production:
   ```bash
   npm run build
   ```

8. Run linter:
   ```bash
   npm run lint
   ```

## Development Accounts

Seed accounts available when running the backend in development:

- **Dispatch Administrator:**
  - Email: `admin@saferoute.com` (or `admin@example.com`)
  - Password: `admin123` (or `AdminSecurePass123!`)
- **Demo Citizen Reporter:**
  - Email: `reporter@example.com`
  - Password: `ReporterPass123!`
- **Demo Emergency Responders:**
  - Ambulance (EMS): `ambulance@example.com` / `ResponderPass123!`
  - Police Unit: `police@example.com` / `ResponderPass123!`
  - Fire Rescue: `fire@example.com` / `ResponderPass123!`

## Geolocation Notes

Live GPS tracking and current position capture require a secure context:
- Supported on `localhost` (development) or any `https://` origin (production).
