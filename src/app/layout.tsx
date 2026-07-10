import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Beacon — early-career startup jobs, matched to your resume",
  description:
    "Upload your resume once. Beacon pulls live entry-level startup openings, ranks them against your profile, and prepares each application for you.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
