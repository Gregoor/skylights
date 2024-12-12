import type { Metadata } from "next";
import localFont from "next/font/local";

import { getSessionAgent } from "@/auth";
import { AvatarLink } from "@/AvatarLink";
import { ClientOnly } from "@/ClientOnly";
import { Stars } from "@/Stars";

import "./globals.css";

import { NavLink } from "./client";

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
        <NavLink href="/">{profile ? "Home" : "Login"}</NavLink>
        {profile && (
          <>
            <AvatarLink className="sm:hidden" profile={profile.data} />
            <NavLink href="/search">Search</NavLink>
          </>
        )}
      </div>
    </>
  );
}

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
        <Header />
        <ClientOnly>
          <Stars />
        </ClientOnly>
        <div className="max-w-xl mx-auto p-4 flex flex-col gap-4">
          {children}
        </div>
      </body>
    </html>
  );
}
