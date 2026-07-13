import type { Metadata } from "next";
// Self-hosted variable fonts (installed via npm, no build-time network fetch).
import "@fontsource-variable/inter";
import "@fontsource-variable/inter-tight";
import "./globals.css";

export const metadata: Metadata = {
  title: "Beacon — your resume knows where you belong",
  description:
    "Import your resume once. Beacon lights up the entry-level startup roles that fit you, with a match score and the reason each one fits.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Geist for the landing hero (the Beacon app UI keeps Inter). */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap"
        />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
