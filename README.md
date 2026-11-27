# OurCity

OurCity is a city waste-reporting and collection-tracking web application. It
connects citizens who report waste issues, administrators who assign work, and
drivers who collect it. The application is built with Next.js and can be
installed on supported mobile devices as a Progressive Web App (PWA).

## Contents

- [Features](#features)
- [Technology](#technology)
- [Requirements](#requirements)
- [Run locally](#run-locally)
- [Environment variables](#environment-variables)
- [Demo accounts](#demo-accounts)
- [Application workflows](#application-workflows)
- [API routes](#api-routes)
- [Project structure](#project-structure)
- [Install the PWA](#install-the-pwa)
- [Deploy to Vercel](#deploy-to-vercel)
- [Security and production readiness](#security-and-production-readiness)
- [Useful commands](#useful-commands)

## Features

### Citizen portal

- Submit a waste complaint with a description, coordinates, and an optional
  image.
- Use the device's location services to capture the report location.
- Look up a nearby place and area name when a reverse-geocoding service is
  configured.
- Review submitted complaints and their collection status.
- View the assigned driver's most recently shared location while a collection
  is active.

### Admin portal

- Review reported complaints and their locations.
- Assign available work to a driver.
- Follow complaint status as drivers start and complete collection work.

### Driver portal

- View work assigned by the admin.
- Start and complete an assigned collection.
- Open directions to the report location using OpenStreetMap.
- Share device location while an active collection is in progress. The driver's
  location is available to the reporting citizen while the driver portal is
  open and location permission is granted.

### Progressive Web App

- Provides a web app manifest, Android and Apple home-screen icons, and an
  install experience for supported browsers.
- Offers a basic offline page when a navigation request cannot reach the
  network.
- Keeps API responses and personalized pages out of the service-worker cache.

## Technology

- **Application:** Next.js App Router, React
- **Styling:** Tailwind CSS and project CSS
- **Maps:** Leaflet and React Leaflet with OpenStreetMap-based map tiles
- **Database:** MongoDB through Mongoose
- **Image storage:** Cloudinary
- **Place lookup:** Self-hosted Nominatim-compatible reverse-geocoding service
- **Deployment:** Vercel (recommended)

## Requirements

- Node.js 20.9 or later
- npm (the repository includes `package-lock.json`)
- MongoDB connection details for complaint persistence
- Cloudinary credentials if reports will include uploaded images
- A self-hosted Nominatim-compatible service if place and area names are
  required

## Run locally

1. Install the dependencies:

   ```bash
   npm ci
   ```

2. Create a `.env.local` file in the repository root and add the environment
   variables described in [Environment variables](#environment-variables).
   `.env.local` is ignored by Git.

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

The report database and image-upload features need their corresponding services
configured. Browser geolocation also requires the user's permission. Browsers
generally require HTTPS for location access; `localhost` is allowed for local
development.

## Environment variables

Set these in `.env.local` for local development and in the deployment
platform's environment-variable settings for deployed environments.

| Variable | Required | Description |
| --- | --- | --- |
| `MONGODB_URI` | Yes, for complaint persistence | MongoDB connection URI. Use the URI for your own MongoDB deployment or Atlas cluster. |
| `AUTH_SESSION_SECRET` | Yes, for authentication | Random secret with at least 32 characters used to sign the HTTP-only session cookie. |
| `AUTH_BOOTSTRAP_KEY` | Once, for first admin setup | Random secret with at least 32 characters. Remove it from the deployment after creating the initial admin. |
| `MONGODB_DB` | No | Database name override. If omitted, the database in the URI is used; when the URI has no database path, the application defaults to `ourcity`. |
| `CLOUDINARY_CLOUD_NAME` | For image uploads | Cloudinary cloud name. |
| `CLOUDINARY_API_KEY` | For image uploads | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | For image uploads | Cloudinary API secret. |
| `NOMINATIM_BASE_URL` | No | Base URL of a self-hosted Nominatim-compatible service. Without it, coordinates can still be submitted, but place and area names are unavailable. |
| `NOMINATIM_USER_AGENT` | No | User-Agent value sent to the reverse-geocoding service. The application has a development default if this is omitted. |

Example `.env.local` structure:

```dotenv
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>?retryWrites=true&w=majority
MONGODB_DB=ourcity
AUTH_SESSION_SECRET=<random-secret-at-least-32-characters>
AUTH_BOOTSTRAP_KEY=<different-random-secret-at-least-32-characters>

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

NOMINATIM_BASE_URL=https://<your-geocoder-host>
NOMINATIM_USER_AGENT=OurCity/0.1.0 (you@example.com)
```

Replace placeholders with your own values. Do not commit credentials, paste
them into source code, or expose them through `NEXT_PUBLIC_` variables. If a
MongoDB username or password contains reserved URL characters, URL-encode
those characters in the connection URI.

Complaint images are stored in the Cloudinary `ourcity/reports` folder. MongoDB
stores complaint data and image references. Existing records in
`data/complaints.json` are not automatically imported into MongoDB.

## Authentication and roles

Citizens create accounts from the sign-in page. Passwords are stored in MongoDB
as salted scrypt hashes, and sessions use an HTTP-only, signed cookie. Admins
create admin and driver accounts from the Role accounts section of the admin
dashboard. Role selection is not available during public registration.

Before enabling sign-in, set `MONGODB_URI` and a unique
`AUTH_SESSION_SECRET` (at least 32 characters) in `.env.local` and in the
deployment environment. Existing demo credentials have been removed. For the
first admin only, temporarily configure a different 32-character
`AUTH_BOOTSTRAP_KEY`, then POST `{ "name", "email", "password" }` to
`/api/auth/bootstrap` with that value in the `x-bootstrap-key` header. The
endpoint refuses creation once an admin exists; remove `AUTH_BOOTSTRAP_KEY`
from the environment immediately afterward. Use the admin dashboard to create
additional admin and driver accounts.

## Application workflows

### Report and track a complaint

1. Create a citizen account or continue to file a public spot report.
2. Capture your current location, create the complaint and provide a description.
3. Allow location access to capture coordinates. If reverse geocoding is configured, the form can also display nearby place and area names.
4. Attach an image. Image upload requires valid Cloudinary
   credentials.
5. Citizens who are signed in can follow reports from their citizen dashboard. Public reports can be checked using the reference and contact number. Once a driver
   starts the assigned collection and shares a location, the citizen can view
   the driver's most recently reported position.

### Assign and collect work

1. An admin reviews complaints and assigns work to a driver.
2. The driver opens their dashboard and starts the assigned collection.
3. The active collection is reflected in the complaint's status. The driver
   can open directions to the complaint location and share their location
   while the active driver portal is open.
4. When the driver completes the collection, location sharing for that task
   stops and the complaint status is updated.

Location sharing depends on browser permission, device location availability,
network connectivity, and the active driver portal remaining open.

## API routes

These are application routes used by the web client. They are not a published
or production-secured public API.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET`, `POST` | `/api/complaints` | Read complaints and submit a complaint. |
| `GET`, `PATCH` | `/api/admin/complaints` | Read and update complaints in the admin workflow, including assignments. |
| `GET`, `POST` | `/api/admin/users` | List staff and create admin or driver accounts (admin role required). |
| `GET`, `PATCH` | `/api/driver/complaints` | Read driver work and update collection progress/location. |
| `POST` | `/api/auth/register` | Register a citizen account. |
| `POST` | `/api/auth/bootstrap` | One-time first-admin creation when no admin exists; requires `AUTH_BOOTSTRAP_KEY`. |
| `POST` | `/api/auth/login` | Sign in with an account. |
| `POST` | `/api/auth/logout` | Clear the session cookie. |
| `GET` | `/api/auth/session` | Read the current session. |
| `GET` | `/api/location/reverse?lat=<latitude>&lon=<longitude>` | Resolve coordinates to a nearby place and area name. |

## Project structure

```text
components/
  admin/       Admin dashboard
  auth/        Authentication provider and role route guards
  citizen/     Complaint form, complaint list, and live tracking map
  driver/      Driver dashboard
  home/        Landing-page sections
  layout/      Navigation, footer, and theme controls
  pwa/         Install prompt and service-worker registration
data/          Legacy/local data files; not automatically migrated
lib/server/    MongoDB and Cloudinary server-side helpers
public/
  pwa-icons/   PWA and Apple home-screen icons
  sw.js        Service worker
  offline.html Offline navigation fallback
src/app/
  api/         Next.js API route handlers
  admin/       Admin dashboard route
  citizen/     Citizen dashboard and complaint routes
  driver/      Driver dashboard route
  login/       Sign-in and citizen registration page
  manifest.js  Web app manifest
```

## Install the PWA

The app's manifest is available at `/manifest.webmanifest`. The service worker
is served from `/sw.js`; it caches the manifest, install icons, and offline
page. It does not cache `/api/` responses or personalized pages, so reporting,
account pages, and live tracking require an internet connection.

### Install on Android

1. Deploy the latest application version to an HTTPS domain.
2. Open the site in a supported browser such as Chrome.
3. Select **Install OurCity** if the in-app install button is available, or
   choose **Install app** / **Add to Home screen** from the browser menu.

### Add to the iPhone home screen

1. Open the deployed site in Safari.
2. Tap **Share**, then choose **Add to Home Screen**.

### Use PWABuilder

PWABuilder must be able to access the deployed manifest and icons. After
deploying the PWA changes:

1. Open [PWABuilder](https://www.pwabuilder.com/).
2. Enter the deployed HTTPS URL and run the analysis.
3. Review any reported manifest, service-worker, or platform-specific
   recommendations.

Installing the PWA from a browser does not require an APK. Packaging an Android
Trusted Web Activity (TWA) for store distribution is a separate task and
requires an Android application/package ID, a signing key, and a
Digital Asset Links file hosted on the app's domain.

## Deploy to Vercel

1. Push the repository to the Git provider connected to your Vercel project.
2. In Vercel project settings, add the environment variables needed for the
   target environment. Do not commit `.env` or `.env.local`.
3. Deploy the project and wait for the build to complete.
4. Open the deployed site and verify that `/manifest.webmanifest`, `/sw.js`,
   and the files under `/pwa-icons/` are reachable.
5. Run PWABuilder against the deployed HTTPS URL if you want to inspect PWA
   readiness or prepare a store package.

The PWA changes are not visible to PWABuilder or mobile browsers until the
updated application has been deployed.

## Security and production readiness

The current application is intended for demonstration and development. Do not
use it to handle sensitive personal or operational data without additional
security work:

- The demo login credentials are included in the client-side application.
- API authorization relies on demo user identifiers and is not server-side
  authentication or robust role-based access control.
- Driver location is sensitive data. Implement authenticated access,
  authorization, retention limits, and clear consent before using real driver
  or citizen data.
- Configure MongoDB and Cloudinary credentials as server-side environment
  variables. Restrict service access according to your deployment's security
  requirements.
- Use HTTPS in deployed environments and review access to reports, images, and
  location data before inviting real users.

## Useful commands

| Command | Description |
| --- | --- |
| `npm ci` | Install the exact dependency versions from `package-lock.json`. |
| `npm run dev` | Start the local development server. |
| `npm run lint` | Run ESLint. |
| `npm run build` | Create a production build. |
| `npm run start` | Start the production server after a successful build. |

## Further reading

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying)
- [Vercel](https://vercel.com/)
- [PWABuilder](https://www.pwabuilder.com/)
