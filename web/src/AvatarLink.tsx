"use client";

import { ProfileViewDetailed } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function AvatarLink({
  className,
  style,
  profile,
  ...props
}: { profile: ProfileViewDetailed } & Omit<
  React.ComponentProps<typeof Link>,
  "href"
>) {
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);
  const href = `/profile/${profile.handle}`;
  if (pathname == href) return null;
  return (
    <Link
      href={href}
      className={"rounded-full w-12 h-12 block " + (className ?? "")}
      style={{
        boxShadow: `0 0 12px ${hovered ? 2 : 0}px white`,
        transition: "box-shadow 150ms linear",
        ...style,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      {...props}
    >
      <img src={profile.avatar} className="rounded-full" />
    </Link>
  );
}
