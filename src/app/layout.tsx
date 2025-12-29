import { Providers } from "@/components/providers";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BACKEND_URL || 'https://www.socialora.app'),
  title: {
    default: "SocialOra - #1 Instagram DM Automation Tool | AI-Powered Cold DM Automation 2025",
    template: "%s | SocialOra - Instagram DM Automation"
  },
  description: "Automate Instagram DMs with AI-powered cold DM automation. Scale outreach, manage conversations, and convert leads. Best Instagram DM automation tool for businesses, creators & agencies. Free 14-day trial.",
  keywords: [
    "Instagram DM automation",
    "Instagram automation tool",
    "cold DM automation",
    "Instagram DM manager",
    "automated Instagram messages",
    "Instagram outreach automation",
    "Instagram DM bot",
    "Instagram marketing automation",
    "Instagram DM scheduler",
    "Instagram direct message automation",
    "Instagram DM automation software",
    "best Instagram automation tool",
    "Instagram automation platform",
    "Instagram DM automation service",
    "Instagram message automation",
    "Instagram DM automation app",
    "Instagram automation 2025",
    "Instagram DM automation free",
    "Instagram automation tool free trial",
    "Instagram DM automation for business",
    "Instagram automation for creators",
    "Instagram DM automation agency",
    "Instagram automation software",
    "Instagram DM automation tool review",
    "how to automate Instagram DMs",
    "Instagram DM automation tutorial",
    "Instagram automation best practices",
    "Instagram DM automation pricing",
    "Instagram automation alternatives",
    "Instagram DM automation features"
  ],
  authors: [{ name: "SocialOra" }],
  creator: "SocialOra",
  publisher: "SocialOra",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "SocialOra",
    title: "SocialOra - #1 Instagram DM Automation Tool | AI-Powered Cold DM Automation 2025",
    description: "Automate Instagram DMs with AI-powered cold DM automation. Scale outreach, manage conversations, and convert leads. Best Instagram DM automation tool for businesses, creators & agencies.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "SocialOra - Instagram DM Automation Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SocialOra - #1 Instagram DM Automation Tool | AI-Powered Cold DM Automation",
    description: "Automate Instagram DMs with AI-powered cold DM automation. Scale outreach, manage conversations, and convert leads. Free 14-day trial.",
    images: ["/og-image.jpg"],
    creator: "@SocialOra",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  category: "technology",
  icons: {
    icon: '/images/logo.png',
    shortcut: '/images/logo.png',
    apple: '/images/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
    <body
      className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
    >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
