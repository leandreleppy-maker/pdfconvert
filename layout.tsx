import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PDF Studio — Mise en page et impression PDF",
  description:
    "Plateforme professionnelle pour importer, modifier, mettre en page et imprimer vos PDF directement dans le navigateur. 100% confidentiel, vos fichiers ne quittent pas votre appareil.",
  keywords: [
    "PDF",
    "mise en page PDF",
    "impression PDF",
    "fusion PDF",
    "découpage PDF",
    "éditeur PDF",
    "PDF Studio",
  ],
  authors: [{ name: "PDF Studio" }],
  openGraph: {
    title: "PDF Studio — Mise en page et impression PDF",
    description:
      "Importez, modifiez, mettez en page et imprimez vos PDF directement dans le navigateur.",
    siteName: "PDF Studio",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster position="top-right" richColors />
      </body>
    </html>
  );
}
