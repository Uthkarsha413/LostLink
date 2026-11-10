import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Navbar from "./components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LostLink | Smart Campus Lost & Found System",
  description: "AI-Powered Lost and Found Management System with smart analytics, item tracking timeline, and secure OTP handovers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
        <Suspense fallback={<div className="h-16 border-b border-slate-800/80 bg-slate-950" />}>
          <Navbar />
        </Suspense>
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}

