"use client";

import {
  ProfileView,
  ProfileViewDetailed,
} from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import cx from "classix";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { entries, isDeepEqual } from "remeda";

import { AvatarLink } from "@/AvatarLink";
import { Button, CardSection, SectionedCard } from "@/ui";
import { now } from "@/utils";

import { getNextTID, useRels, useRelsLoading } from "./ctx";
import { ListButton } from "./ListButton";
import { RatingSlider } from "./RatingSlider";
import { TypeIcon } from "./TypeIcon";
import { Badge } from "./ui";
import { RelRecordValue } from "./utils";

function ImgWithDummy(props: React.ComponentProps<"img">) {
  const [status, setStatus] = useState<
    "initial" | "loading" | "error" | "done"
  >("initial");

  useEffect(() => {
    setStatus("loading");
    if (!props.src) return;
    const img = new Image();
    img.src = props.src as string;
    img.onload = (event) => {
      setStatus(
        (event.target as HTMLImageElement).naturalWidth == 1 ? "error" : "done",
      );
    };
  }, [props.src]);

  if (status == "loading" || status == "error") {
    return (
      <div
        className={cx(
          "border border-gray-400/50 w-full h-full flex items-center justify-center",
          "text-gray-300",
          status == "loading" && "animate-pulse",
        )}
      >
        {status == "error" && "?"}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt} />
  );
}

export const Title = ({ children }: { children: React.ReactNode }) => (
  <div className="font-serif text-xl">{children}</div>
);

function ClampedNote({ value }: { value: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [clamped, setClamped] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setClamped(el.scrollHeight > el.clientHeight);
  }, [value]);
  return (
    <div
      role={clamped && !isOpen ? "button" : undefined}
      onClick={() => !isOpen && setIsOpen(true)}
      className={clamped && !isOpen ? "cursor-pointer hover:opacity-80" : ""}
    >
      <div ref={ref} className={isOpen ? "" : "line-clamp-4 text-ellipsis"}>
        {value}
      </div>
      {clamped && (
        <button
          type="button"
          className="text-gray-400 hover:opacity-80"
          onClick={() => setIsOpen((isOpen) => !isOpen)}
        >
          Show {isOpen ? "less" : "more"}
        </button>
      )}
    </div>
  );
}

export function BaseCard({
  imgSrc,
  item,
  type,
  reviewer,
  profileHandle,
  readonly,
  ago,
  children,
}: {
  imgSrc: string;
  item: RelRecordValue["item"];
  type: "book" | "film" | "show";
  readonly?: boolean;
  profileHandle?: string;
  reviewer?: ProfileView | ProfileViewDetailed;
  ago?: string;
  children?: React.ReactNode;
}) {
  const { rels, putRel, deleteRel } = useRels();
  const key = useMemo(
    () =>
      entries(rels).find(([, rel]) => isDeepEqual(item, rel?.item))?.[0] ??
      getNextTID(),
    [item, rels],
  );
  const rel = rels[key] as RelRecordValue | undefined;

  const patch = (fields: Partial<RelRecordValue>) => {
    const record = {
      $type: "my.skylights.rel",
      item,
      ...rel,
      ...fields,
    } as const;
    if (record.note || record.rating) {
      putRel(key, record);
    } else {
      deleteRel(key);
    }
  };

  const loading = useRelsLoading();

  const [noteDraft, setNoteDraft] = useState<string | null>(null);
  const ratingValue = rel?.rating?.value;

  const pathname = usePathname();
  const itemPathname = `/reviews/${item.ref}/${item.value}`;
  return (
    <SectionedCard>
      {reviewer && (
        <CardSection className="flex flex-row items-center gap-2">
          <AvatarLink smol profile={reviewer} />
          <div>
            <Link href={`/profile/${reviewer.handle}`}>
              <span className="hover:underline">{reviewer.displayName}</span>{" "}
              <span className="text-gray-400">@{reviewer.handle}</span>
            </Link>

            {ago && (
              <>
                {" · "}
                <Link
                  href={`/profile/${reviewer.handle}/review/${item.ref}/${item.value}`}
                  className="text-gray-400 hover:opacity-80"
                >
                  {ago}
                </Link>
              </>
            )}
          </div>
        </CardSection>
      )}
      <CardSection className="relative flex flex-row gap-4">
        <div
          className="absolute top-0 right-0 p-1 bg-gray-700"
          style={{ borderBottomLeftRadius: 6 }}
        >
          <TypeIcon value={type} />
        </div>

        <Link href={itemPathname}>
          <div className="border border-gray-600/50 flex-shrink-0 w-32 h-48 sm:w-40 sm:h-60 flex justify-center">
            <ImgWithDummy
              className="max-w-full max-h-full object-contain"
              src={imgSrc}
            />
          </div>
        </Link>
        <div className="w-full flex flex-col gap-2">
          <div className="pr-0.5">
            {pathname == itemPathname ? (
              <div>{children}</div>
            ) : (
              <Link href={itemPathname} className="hover:opacity-80">
                {children}
              </Link>
            )}
          </div>

          <div className="flex flex-row gap-3 items-center">
            {(!readonly || ratingValue) && (
              <RatingSlider
                disabled={readonly || loading}
                value={ratingValue ?? null}
                onChange={(value) => {
                  patch({
                    rating: value ? { value, createdAt: now() } : undefined,
                  });
                }}
              />
            )}

            <ListButton item={item} />
          </div>

          {!readonly && noteDraft == null && !rel?.note && (
            <Button
              className="mt-2 w-fit"
              onClick={() => setNoteDraft(rel?.note?.value ?? "")}
              disabled={loading}
            >
              {rel?.note ? "Edit" : "Add"} note
            </Button>
          )}

          {/* {readonly && !reviewer && (
            <em>
              <Link href="/" className="underline hover:opacity-80">
                Login
              </Link>{" "}
              to review this work
            </em>
          )} */}

          {noteDraft != null ? (
            <div className="mt-2 w-full flex flex-col gap-2">
              <TextareaAutosize
                className={[
                  "border rounded-lg border-gray-700 focus:border-gray-400",
                  "transition-all p-2 outline-none w-full flex bg-transparent",
                  "resize-none",
                ].join(" ")}
                placeholder="..."
                autoFocus
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => {
                    setNoteDraft(null);
                  }}
                >
                  Abort
                </Button>
                <Button
                  className="border-green-200 text-green-200"
                  onClick={() => {
                    patch({
                      note: {
                        value: noteDraft,
                        createdAt: rel?.note?.createdAt ?? now(),
                        updatedAt: now(),
                      },
                    });
                    setNoteDraft(null);
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            rel?.note && (
              <div>
                <h3 className="text-gray-500 text-sm font-semibold">
                  {profileHandle ? (
                    <Link
                      href={`/profile/${profileHandle}/review/${item.ref}/${item.value}`}
                      className="hover:opacity-80"
                    >
                      Note
                    </Link>
                  ) : (
                    "Note"
                  )}
                  {!readonly && (
                    <>
                      {" "}
                      (
                      {profileHandle && (
                        <>
                          <Link
                            href={`/profile/${profileHandle}/review/${item.ref}/${item.value}`}
                            className="text-gray-300 underline hover:opacity-80"
                          >
                            view
                          </Link>
                          {" | "}
                        </>
                      )}
                      <button
                        type="button"
                        className="text-gray-300 underline hover:opacity-80"
                        onClick={() => setNoteDraft(rel?.note?.value ?? "")}
                      >
                        edit
                      </button>
                      {" | "}
                      <button
                        type="button"
                        className="text-red-500 underline hover:opacity-80"
                        onClick={() =>
                          confirm("Do you really want to delete your note?") &&
                          patch({ note: undefined })
                        }
                      >
                        delete
                      </button>
                      )
                    </>
                  )}
                </h3>
                <ClampedNote value={rel.note.value} />
              </div>
            )
          )}
        </div>
      </CardSection>
    </SectionedCard>
  );
}
