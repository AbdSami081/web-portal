import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/authContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Supernova | Web Portal",
  description: "Advanced Enterprise Portal for SAP Business One",
  icons: {
    icon: [
      {
        url: "/assets/logo.png",
        href: "/assets/logo.png",
      },
    ],
  },
};

import { SessionWatcher } from "@/components/shared/SessionWatcher";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <AuthProvider>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          suppressHydrationWarning
        >
          {children}
          <Toaster position="top-right" richColors /> {/* Sonner container */}
          <SessionWatcher />
        </body>
      </AuthProvider>
    </html>
  );
}
