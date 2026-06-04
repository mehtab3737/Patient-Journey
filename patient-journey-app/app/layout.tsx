import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Patient Journey AI — Clinical Decision Support",
  description:
    "AI-powered clinical assistant for doctors to query, analyze, and update patient records in real time.",
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
