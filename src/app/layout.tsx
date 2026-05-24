import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Asisten Hunian",
  description: "Layanan kebersihan hunian terpercaya — bersihkan unit, kasur, karpet, dan lebih.",
  openGraph: {
    title: "Asisten Hunian",
    description: "Layanan kebersihan hunian terpercaya",
    type: "website",
    locale: "id_ID",
  },
  twitter: {
    card: "summary",
    title: "Asisten Hunian",
    description: "Layanan kebersihan hunian terpercaya",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
