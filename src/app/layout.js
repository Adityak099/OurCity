import "./globals.css";
import "leaflet/dist/leaflet.css";

import { AuthProvider } from "@/components/auth/AuthProvider";
import PwaSupport from "@/components/pwa/PwaSupport";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RouteFooter from "@/components/layout/RouteFooter";

export const metadata = {
  title: "OurCity | A Smart Solution for a Cleaner India.",
  description:
    "OurCity connects citizens, waste collection teams and city authorities to build cleaner and greener cities.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "OurCity",
  },
  icons: {
    icon: [
      { url: "/pwa-icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/pwa-icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/pwa-icons/apple-touch-icon.png",
  },
};

export const viewport = {
  themeColor: "rgb(247 249 244)",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" style={{ colorScheme: "light" }}>
      <body>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <AuthProvider>
          <Navbar />
          {children}
          <RouteFooter>
            <Footer />
          </RouteFooter>
          <PwaSupport />
        </AuthProvider>
      </body>
    </html>
  );
}
