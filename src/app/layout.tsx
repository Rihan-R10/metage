import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "TokenDash | LLM Telemetry & Vault",
  description: "Real-time, privacy-first LLM usage telemetry, latency metrics, and client-side encrypted key vault.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} dark h-full antialiased`}>
      <body className={`${jetbrainsMono.className} min-h-full flex flex-col bg-[#090a0f] text-cyan-400 selection:bg-cyan-500/20 selection:text-cyan-200`}>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}