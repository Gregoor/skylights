import type { Metadata } from "next";
import localFont from "next/font/local";

// import { getSessionAgent } from "@/auth";
import { AvatarLink } from "@/AvatarLink";
import { ClientOnly } from "@/ClientOnly";
import { Stars } from "@/Stars";

import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Skylights",
};

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
        {/* <Header /> */}
        <ClientOnly>
          <Stars />
        </ClientOnly>
        <div className="max-w-lg mx-auto p-4 flex flex-col gap-4">
          {children}
        </div>
      </body>
    </html>
  );
}
