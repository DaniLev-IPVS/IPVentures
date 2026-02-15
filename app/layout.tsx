import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IP Ventures — Building the Next Generation of IP",
  description:
    "IP Ventures is a full-service creative studio specializing in IP development, 3D animation, digital production, and influencer networks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
