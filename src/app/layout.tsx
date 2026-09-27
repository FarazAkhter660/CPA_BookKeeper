import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StateProvider } from "@/components/providers/state-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Loopnow CPA Copilot",
  description: "AI-powered Canadian bookkeeping and GST/HST compliance agent",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <StateProvider>
          {children}
        </StateProvider>
      </body>
    </html>
  );
}
