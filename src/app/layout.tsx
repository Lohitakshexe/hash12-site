import type { Metadata } from "next";
import TargetCursor from "@/components/TargetCursor";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hash 12 | DL DAV Model School Shalimar Bagh",
  description: "Join us for Hash 12, the premier event hosted by DL DAV Model School Shalimar Bagh. Explore innovation, technology, and creativity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <TargetCursor 
          targetSelector="a, button, .event-card, .nav-btn, .chat-toggle-btn"
          cursorColor="#00ffff"
          cursorColorOnTarget="#ffffff"
        />
        {children}
      </body>
    </html>
  );
}
