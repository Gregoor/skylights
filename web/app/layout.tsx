import type { Metadata } from "next";
import localFont from "next/font/local";
import Image from "next/image";

import { getSessionAgent } from "@/auth";
import { AvatarLink } from "@/AvatarLink";
import { ClientOnly } from "@/ClientOnly";
import { HasSessionProvider } from "@/session-ctx";
import { Stars } from "@/Stars";

import { NavLink } from "./client";
import logo from "./logo.png";

import "./globals.css";

import Link from "next/link";

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

export const metadata: Metadata = { title: "Skylights" };

async function Header() {
  const agent = await getSessionAgent(false);
  const profile = await agent?.getProfile({ actor: agent.did! });
  return (
    <>
      {profile && (
        <AvatarLink
          className="hidden sm:block absolute right-3"
          profile={profile.data}
          style={{ top: 13 }}
        />
      )}
      <div className="mt-4 flex gap-6 justify-center items-center">
        {profile && <div className="hidden sm:block" />}
        <NavLink href="/">
          <Image src={logo} alt="Skylights" className="w-44 sm:w-64" />
        </NavLink>
        {profile && (
          <>
            <AvatarLink className="sm:hidden" profile={profile.data} />
            <Link
              href="/search"
              className="border rounded px-2 py-1 flex flex-col items-center transition-all hover:bg-black hover:invert"
            >
              <span className="text-xl">🔭</span>
              <span className="text-sm">Search</span>
            </Link>
          </>
        )}
      </div>
    </>
  );
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const agent = await getSessionAgent(false);
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header />
        <ClientOnly>
          <Stars />
        </ClientOnly>
        <HasSessionProvider value={!!agent}>
          <div className="max-w-4xl mx-auto p-4 flex flex-col gap-4">
            {children}
          </div>
        </HasSessionProvider>
      </body>
    </html>
  );
}
