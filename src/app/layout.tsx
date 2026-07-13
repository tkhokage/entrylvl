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
        {/* Helvetica Now Display for the landing hero (Beacon UI keeps Inter). */}
        <link
          rel="stylesheet"
          href="https://db.onlinewebfonts.com/c/5ac3fe7c6abd2f62067f266d89671492?family=HelveticaNowDisplay-Medium"
        />
        <link
          rel="stylesheet"
          href="https://db.onlinewebfonts.com/c/1aa3377e489837a26d019bba501e779d?family=HelveticaNowDisplayW01-Rg"
        />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
