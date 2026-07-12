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
      <body className="font-sans">{children}</body>
    </html>
  );
}
