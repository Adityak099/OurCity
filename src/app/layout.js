import "./globals.css";
import "leaflet/dist/leaflet.css";

import { AuthProvider } from "../../components/auth/AuthProvider";
import ThemeToggle from "../../components/layout/ThemeToggle";

export const metadata = {
  title: "CleanCity | Smarter Waste. Cleaner Streets.",
  description:
    "CleanCity connects citizens, waste collection teams and city authorities to build cleaner and greener cities.",
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
          <ThemeToggle />
        </AuthProvider>
      </body>
    </html>
  );
}
