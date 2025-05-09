"use client";

import { ProfileViewDetailed } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import cx from "classix";
import { BookIcon, FilmIcon, TvMinimalIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import ClickAwayListener from "react-click-away-listener";
import { useFormStatus } from "react-dom";

import { AvatarLink } from "@/AvatarLink";
import { getBasicItemFields, Info } from "@/items/info";
import { RatingSlider } from "@/items/RatingSlider";
import { RelRecordValue } from "@/items/utils";
import { timeSince } from "@/utils";

export function SubmitButton() {
  const { pending } = useFormStatus();
  return (
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

export function Memput(
  props: { name: string } & React.ComponentProps<"input">,
) {
  const [value, setValue] = useState(
    props.value ??
      (typeof localStorage == "undefined"
        ? ""
        : (localStorage.getItem(props.name) ?? "")),
  );
  useEffect(() => {
    localStorage.setItem(props.name, value?.toString());
  }, [props.name, value]);
  return (
    <input
      {...props}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}

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
            <span title={fields.type}>
              {React.createElement(
                { movie: FilmIcon, show: TvMinimalIcon, book: BookIcon }[
                  fields.type
                ]!,
                { size: 16 },
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
