import type { Metadata } from "next";
import {  Geist_Mono, Syne } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import {AuthProvider} from "@riverpen/auth";
import {PreferencesProvider} from "@/constants";
import { Toaster } from "@/components/ui/sonner";
import AppShell from "@/components/home/AppShell";

const syne = Syne({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RiverPen Diary",
  description: "Simple Diary App With Voice input",
  icons: {
    icon: "/favicon.ico",
  },
  metadataBase: new URL("https://diary.riverpen.com"),
  openGraph: {
    title: "RiverPen Diary",
    description: "Simple Diary App With Voice input",
    url: "https://diary.riverpen.com",
    siteName: "RiverPen Diary",
    images: [
      {
        url: "https://diary.riverpen.com/og.png",
        width: 1200,
        height: 630,
      }
    ]
  },
  authors: [
      {
        name: "RiverPen Technologies",
        url: "https://riverpen.com"
      },
    {
      name: "Washington Mwangi",
      url: "https://washington.riverpen.com"
    }
      ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", syne.variable, geistMono.variable, "font-sans")}
    >
      <body className="bg-bg2 min-h-full flex flex-col">
      <AuthProvider>
        <PreferencesProvider>
          <AppShell>{children}</AppShell>
          <Toaster />
        </PreferencesProvider>
      </AuthProvider>
      </body>

    </html>
  );
}
