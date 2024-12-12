"use client";

import { ProfileViewDetailed } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import cx from "classix";
import Link from "next/link";
import { useState } from "react";

export function AvatarLink({
  className,
  style,
  profile,
  smol,
  ...props
}: { profile: ProfileViewDetailed; smol?: boolean } & Omit<
  React.ComponentProps<typeof Link>,
  "href"
>) {
  const [hovered, setHovered] = useState(false);
  const href = `/profile/${profile.handle}`;
  return (
    <Link
      href={href}
      className={cx(
        "rounded-full block",
        className,
        smol ? "w-8 h-8" : "w-12 h-12",
      )}
      style={{
        boxShadow: `0 0 ${smol ? 8 : 12}px ${hovered ? (smol ? 1 : 2) : 0}px white`,
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
