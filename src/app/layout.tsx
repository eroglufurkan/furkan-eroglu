import type { Metadata, Viewport } from "next";
import { PROFILE } from "@/content/portfolio";
import { THEME_STORAGE_KEY } from "@/game/theme";
import "./globals.css";

const TITLE = `${PROFILE.name} — ${PROFILE.role}`;
const DESCRIPTION =
  "A portfolio you can walk around: a small top-down room with the projects, skills and contact inside. Or read it as a plain page.";

/** Vercel fills this in on deploy; locally it falls back to the dev server. */
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: PROFILE.name,
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
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
