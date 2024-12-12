"use client";

import { ProfileView } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import cx from "classix";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { entries } from "remeda";

import { AvatarLink } from "@/AvatarLink";
import { Button, CardSection, SectionedCard } from "@/ui";
import { now } from "@/utils";

import { getNextTID, useRels, useRelsLoading } from "./ctx";
import { RatingSlider } from "./RatingSlider";
import { RelRecordValue } from "./utils";

function ImgWithDummy(props: React.ComponentProps<"img">) {
  const [status, setStatus] = useState<
    "initial" | "loading" | "error" | "done"
  >("initial");

  useEffect(() => {
    setStatus("loading");
    if (!props.src) return;
    const img = new Image();
    img.src = props.src;
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

export type Book = {
  title: string;
  edition_key: string;
  work_key: string;
  authors: string[];
  isbn_13: string[];
  isbn_10: string[];
};

export function BookCard({
  book,
  reviewer,
  readonly,
  ago,
}: {
  book: Book;
  readonly?: boolean;
  reviewer?: ProfileView;
  ago?: string;
}) {
  const editionKey = book.edition_key;
  const isbns = [...book.isbn_13, ...book.isbn_10];

  const { rels, putRel, deleteRel } = useRels();
  const key = useMemo(
    () =>
      entries(rels).find(([, rel]) => rel!.item.value == editionKey)?.[0] ??
      getNextTID(),
    [editionKey, rels],
  );
  const rel = rels[key] as RelRecordValue | undefined;

  const patch = (fields: Partial<RelRecordValue>) => {
    const record = {
      item: { ref: "open-library", value: editionKey },
      ...rel,
      ...fields,
    };
    if (record.note || record.rating) {
      putRel(key, record);
    } else {
      deleteRel(key);
    }
  };

  const loading = useRelsLoading();

  const [noteDraft, setNoteDraft] = useState<string | null>(null);
  const ratingValue = rel?.rating?.value;
  return (
    <SectionedCard>
      {reviewer && (
        <CardSection className="flex flex-row items-center gap-2">
          <AvatarLink smol profile={reviewer} />
          <Link href={`/profile/${reviewer.handle}`}>
            <span className="hover:underline">{reviewer.displayName}</span>{" "}
            <span className="text-gray-400">
              @{reviewer.handle}
              {ago && " · " + ago}
            </span>
          </Link>
        </CardSection>
      )}
      <CardSection className="flex flex-row gap-4">
        <div className="border border-gray-600/50 flex-shrink-0 w-32 h-48 sm:w-40 sm:h-60 flex justify-center">
          <ImgWithDummy
            className="max-w-full max-h-full object-contain"
            alt={`Book cover for "${book.title}"`}
            src={`https://covers.openlibrary.org/b/olid/${book.edition_key}-L.jpg`}
          />
        </div>
        <div className="w-full flex flex-col gap-2">
          <div>
            {book.title}
            <div className="flex flex-row gap-2">
              <div className="text-gray-400">{book.authors?.join(", ")}</div>
              {isbns.length > 0 && (
                <details className="ml-auto text-sm text-gray-500">
                  <summary className="list-none underline text-end cursor-pointer">
                    ISBN
                  </summary>
                  <p className="whitespace-pre">{isbns.join("\n")}</p>
                </details>
              )}
            </div>
          </div>

          {(!readonly || ratingValue) && (
            <RatingSlider
              disabled={readonly || loading}
              value={ratingValue ?? 0}
              onChange={(value) => {
                if (ratingValue == value) {
                  patch({ rating: undefined });
                } else {
                  patch({ rating: { value, createdAt: now() } });
                }
              }}
            />
          )}

          {!readonly && noteDraft == null && !rel?.note && (
            <Button
              className="mt-2 w-fit"
              onClick={() => setNoteDraft(rel?.note?.value ?? "")}
              disabled={loading}
            >
              {rel?.note ? "Edit" : "Add"} note
            </Button>
          )}

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
                  intent="danger"
                  onClick={() => {
                    patch({ note: undefined });
                    setNoteDraft(null);
                  }}
                >
                  Delete
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
              <div
                role={readonly ? undefined : "button"}
                onClick={() => {
                  if (!readonly) {
                    setNoteDraft(rel?.note?.value ?? "");
                  }
                }}
              >
                <h3 className="text-gray-500 text-sm font-semibold">Note</h3>
                {rel.note.value}
              </div>
            )
          )}
        </div>
      </CardSection>
    </SectionedCard>
  );
}
