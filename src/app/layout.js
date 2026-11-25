import "./globals.css";
import "leaflet/dist/leaflet.css";

import { AuthProvider } from "../../components/auth/AuthProvider";
import ThemeToggle from "../../components/layout/ThemeToggle";
import PwaSupport from "../../components/pwa/PwaSupport";

export const metadata = {
  title: "CleanCity | Smarter Waste. Cleaner Streets.",
  description:
    "CleanCity connects citizens, waste collection teams and city authorities to build cleaner and greener cities.",
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
  themeColor: "#176b45",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('cleancity-theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.classList.toggle('dark',t==='dark')}catch(e){}",
          }}
        />
      </head>
      <body>
        <AuthProvider>
          {children}
          <PwaSupport />
          <ThemeToggle />
        </AuthProvider>
      </body>
    </html>
  );
}
