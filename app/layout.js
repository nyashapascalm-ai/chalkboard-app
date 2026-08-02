import "./globals.css";
import PortalScrollManager from '../components/PortalScrollManager';
import SidebarIconEnhancer from '../components/SidebarIconEnhancer';

export const metadata = {
  title: { default: "Chalkboard Ã¢â‚¬â€ School Management. Simplified.", template: "%s | Chalkboard" },
  description: "Run attendance, learner records, academics, finance, reports and school operations from one connected platform.",
  applicationName: "Chalkboard",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: "/apple-touch-icon.png"
  }
};

export const viewport = { themeColor: "#041a4d" };

export default function RootLayout({ children }) {
  return <html lang="en"><body>
        <SidebarIconEnhancer />
        <PortalScrollManager />{children}</body></html>;
}
