import type { Metadata, Viewport } from "next";
import { PROFILE } from "@/content/portfolio";
import { THEME_STORAGE_KEY } from "@/game/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: `${PROFILE.name} — ${PROFILE.role}`,
  description:
    "A small playable room. Walk around, inspect the desk, the dev station and the workbench, or open the plain portfolio instead.",
  openGraph: {
    title: `${PROFILE.name} — ${PROFILE.role}`,
    description: "A tiny playable portfolio room.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#fdf4e3",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Applies the stored theme before the first paint, so there is no flash of
  // the wrong room while React hydrates.
  const noFlash =
    "try{var t=localStorage.getItem(" +
    JSON.stringify(THEME_STORAGE_KEY) +
    ");if(t===\"bright\"||t===\"dark\")document.documentElement.dataset.theme=t}catch(e){}";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlash }} />
      </head>
      <body className="min-h-full bg-void text-bone antialiased">{children}</body>
    </html>
  );
}
