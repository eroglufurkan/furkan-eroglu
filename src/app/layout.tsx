import type { Metadata, Viewport } from "next";
import { PROFILE } from "@/content/portfolio";
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
  themeColor: "#07080a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-full bg-void text-bone antialiased">{children}</body>
    </html>
  );
}
