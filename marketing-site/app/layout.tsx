import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mic2Text - Voice typing that actually works",
  description: "Press Shift+Option. Speak. That's it. Voice typing that works in every app. $3/month. 7-day free trial.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
