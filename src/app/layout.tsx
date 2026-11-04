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
  title: "PayEscrow AI | Autonomous B2B Procurement & PayPal Milestone Escrow",
  description:
    "Autonomous B2B micro-procurement agent powered by PayPal Agent Toolkit, Channel3 Product Graph, AG Grid, and APIMatic.",
  openGraph: {
    title: "PayEscrow AI | Autonomous B2B Procurement & PayPal Milestone Escrow",
    description:
      "Autonomous B2B micro-procurement agent powered by PayPal Agent Toolkit, Channel3 Product Graph, AG Grid, and APIMatic.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
