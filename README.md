This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Reverse geocoding

The complaint form uses a self-hosted Nominatim instance to display a place and
area name after capturing a location. Set `NOMINATIM_BASE_URL` in `.env.local`
to the instance's base URL (for example, `https://geocoder.example.com`). The
public Nominatim service is not used. Without this setting, the form still
captures and submits coordinates, but cannot display place and area names.

## Data storage

Complaint records are stored in MongoDB using the server-only `MONGODB_URI`
setting. Add `MONGODB_DB` to select a database explicitly; if omitted, the
database in the URI is used, or `ourcity` when the URI has no database path.
Complaint images are uploaded to the `ourcity/reports` folder in Cloudinary
using `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and
`CLOUDINARY_API_SECRET`. Keep these values server-side; never prefix them with
`NEXT_PUBLIC_`. Existing `data/complaints.json` records are not automatically
migrated. The MongoDB client is reused across requests with the driver's
default connection-pool settings; monitor Atlas connection and operation
metrics after deployment before considering pool tuning.

## Admin and driver dashboards

The admin dashboard assigns complaints to drivers. The driver portal supports
starting and completing assigned work. Starting collection requires browser
location permission; while the active driver portal is open, the driver's
location is shared with the reporting citizen and refreshed approximately every
five seconds. Sharing stops when the task is completed. Drivers can open
OpenStreetMap directions to the report location, and citizens see the driver's
last reported position on an OpenStreetMap map.

These APIs check demo user IDs only; they are not server-authenticated and are
not suitable for production or sensitive location data.

## Installable PWA

The app exposes its web app manifest at `/manifest.webmanifest`, includes
Android and Apple home-screen icons, and registers `public/sw.js`. The service
worker caches the manifest, icons, and offline page only; reports, account
pages, live tracking, and API responses still require a network connection.

After pushing the changes and allowing Vercel to redeploy, install from Chrome's
menu on Android or use the in-app install button. On iOS, open the site in
Safari and choose **Share → Add to Home Screen**. You can then check the
deployed URL with [PWABuilder](https://www.pwabuilder.com/). Creating a Play
Store Trusted Web Activity later additionally requires an Android package ID,
signing certificate, and a Digital Asset Links file on the deployed domain.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
