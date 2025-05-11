"use client";

import { ProfileViewDetailed } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import cx from "classix";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import ClickAwayListener from "react-click-away-listener";

import { AvatarLink } from "@/AvatarLink";
import { getBasicItemFields, Info } from "@/items/info";
import { RatingSlider } from "@/items/RatingSlider";
import { TypeIcon } from "@/items/TypeIcon";
import { RelRecordValue } from "@/items/utils";
import { Card } from "@/ui";
import { timeSince } from "@/utils";

import { login } from "./actions";

export function SignInCard() {
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const [handle, setHandle] = useState(
    typeof localStorage == "undefined"
      ? ""
      : (localStorage.getItem("handle") ?? ""),
  );
  useEffect(() => {
    localStorage.setItem("handle", handle);
  }, [handle]);
  return (
    <Card
      className="mx-auto w-full max-w-sm"
      sectionClassName="flex flex-col gap-2"
    >
      <h1 className="text-lg">Sign-in with Bluesky</h1>
      <form
        className="flex flex-row gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setPending(true);
          login(handle, searchParams.get("returnTo"));
        }}
      >
        <label
          className={cx(
            "group border rounded-lg border-gray-400 focus-within:border-white",
            "transition-all w-full flex flex-row bg-black",
          )}
        >
          <div
            className={cx(
              "border-r border-gray-400 px-2 flex items-center text-gray-400",
              "group-focus-within:border-white group-focus-within:text-white",
              "transition-all text-sm",
            )}
          >
            @
          </div>
          <input
            type="text"
            placeholder="Handle"
            autoCorrect="off"
            autoComplete="off"
            className="outline-none p-2 w-full bg-transparent"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className={[
            "border rounded-full border-gray-400 m-0.5 py-1 px-2",
            "hover:!filter-none hover:border-white transition-all",
            pending ? "animate-pulse" : "",
          ].join(" ")}
          style={{
            WebkitTransition: "-webkit-filter 200ms linear",
            filter: pending ? undefined : "brightness(50%) invert(70%)",
          }}
        >
          💫
        </button>
      </form>
    </Card>
  );
}

export const NavLink = ({
  className,
  ...props
}: React.ComponentProps<typeof Link>) => {
  const pathname = usePathname();
  return (
    <Link
      className={cx(
        className,
        "hover:underline",
        pathname == props.href ? "text-white" : "text-gray-500",
      )}
      {...props}
    >
      {props.children}
    </Link>
  );
};

export function ReviewCarousel({
  profile,
  rels,
  info,
}: {
  profile: ProfileViewDetailed;
  rels: { key: string; value: RelRecordValue }[];
  info: Info;
}) {
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const relsWithFields = useMemo(
    () =>
      rels.filter(
        ({ value: { item } }) => item && getBasicItemFields(item, info),
      ),
    [rels, info],
  );
  const rel = useMemo(() => relsWithFields.at(index), [relsWithFields, index]);
  const item = rel?.value.item;
  const fields = item ? getBasicItemFields(item, info) : null;
  if (!fields) return null;
  const ratedAt = rel?.value.rating?.createdAt ?? rel?.value.note?.createdAt;
  return (
    <div className="border border-gray-600/60 flex flex-col">
      <ClickAwayListener onClickAway={() => setExpanded(false)}>
        <div
          className="relative w-full overflow-hidden"
          style={{ aspectRatio: "2/3" }}
          onClick={() => setExpanded(true)}
          onMouseEnter={() => setExpanded(true)}
          onMouseLeave={() => setExpanded(false)}
        >
          <img
            key={index}
            src={fields.imageURL}
            alt={fields.title}
            loading="lazy"
          />
          <div
            className={cx(
              "absolute left-0 top-0 p-2 w-full h-full overflow-hidden",
              "bg-gray-700/70 transition-opacity",
              !expanded && "pointer-events-none",
            )}
            style={{ opacity: +expanded * 100 }}
          >
            <Link
              className="block text-center text-lg mb-2 hover:underline"
              href={`/reviews/${item?.ref}/${item?.value}`}
            >
              {fields.title}
            </Link>
            <Link
              className="hover:opacity-80"
              href={`/profile/${profile.handle}/review/${item?.ref}/${item?.value}`}
            >
              <p>{rel?.value.note?.value}</p>
            </Link>
          </div>
        </div>
      </ClickAwayListener>
      <div className="p-0.5 bg-gray-600/60">
        <div className="flex flex-row justify-between gap-1">
          <button
            type="button"
            className={cx(
              "px-2 hover:bg-gray-200/20 font-mono font-semibold",
              index == 0 && "invisible",
            )}
            onClick={() => setIndex((i) => i - 1)}
          >
            {"←"}
          </button>
          <div className="flex items-center">
            <RatingSlider
              value={rel?.value.rating?.value ?? null}
              disabled
              smol
            />
          </div>
          <button
            type="button"
            className={cx(
              "px-2 hover:bg-gray-200/20 font-mono font-semibold",
              index + 1 == relsWithFields.length && "invisible",
            )}
            onClick={() => setIndex((i) => i + 1)}
          >
            {"→"}
          </button>
        </div>
        <div className="flex flex-row items-center gap-2">
          <AvatarLink profile={profile} className="!w-5 !h-5" />
          <NavLink
            href={`/profile/${profile.handle}`}
            className="!text-white overflow-hidden whitespace-nowrap text-ellipsis"
          >
            {profile.displayName}
          </NavLink>
          <div className="ml-auto text-gray-400 flex flex-row items-center gap-1">
            {ratedAt && timeSince(new Date(ratedAt))}
            <TypeIcon value={fields.type} />
          </div>
        </div>
      </div>
    </div>
  );
}
