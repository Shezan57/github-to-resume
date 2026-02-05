import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GitHub Resume Generator - Transform Your GitHub Profile Into a Resume",
  description: "AI-powered resume generator that analyzes your GitHub repositories and creates a professional resume in seconds. Free and open source.",
  keywords: ["resume", "github", "resume generator", "developer resume", "AI resume", "portfolio"],
  authors: [{ name: "GitHub Resume Generator" }],
  openGraph: {
    title: "GitHub Resume Generator",
    description: "Transform your GitHub profile into a professional resume with AI",
    type: "website",
  },
};

import { AuthProvider } from "@/contexts/auth-context";
import { UsageProvider } from "@/contexts/usage-context";
import { RegistrationWall } from "@/components/auth/registration-wall";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <UsageProvider>
            {children}
            <RegistrationWall />
          </UsageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
