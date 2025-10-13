import type { Metadata } from "next";
import "./globals.css";
import { FORMATTED_PRICE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "NarraFlow - Voice typing that actually works",
  description: `Press Shift+Option. Speak. That's it. Voice typing that works in every app. ${FORMATTED_PRICE}/month. 7-day free trial.`,
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
