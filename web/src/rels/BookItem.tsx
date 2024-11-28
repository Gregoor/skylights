"use client";

import cx from "classix";
import { useEffect, useMemo, useState } from "react";
import { Rating } from "react-simple-star-rating";
import TextareaAutosize from "react-textarea-autosize";
import { entries } from "remeda";

import { Button, CardSection, SectionedCard } from "@/ui";
import { now } from "@/utils";

import { getNextTID, useRels } from "./RelsCtx";
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
          "border border-gray-400/50 h-full flex items-center justify-center",
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
  readonly,
}: {
  book: Book;
  readonly?: boolean;
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

  const [noteDraft, setNoteDraft] = useState<string | null>(null);
  const ratingValue = rel?.rating?.value;
  return (
    <SectionedCard>
      <CardSection className="flex flex-row gap-4">
        <div className="flex-shrink-0 w-24 h-36 ">
          <ImgWithDummy
            key={book.edition_key}
            className="border border-gray-700/50 max-w-full max-h-full object-contain"
            alt={`Book cover for "${book.title}"`}
            src={`https://covers.openlibrary.org/b/olid/${book.edition_key}-M.jpg`}
          />
        </div>
        <div className="w-full flex flex-col gap-2">
          <div>
            {book.title}
            <div className="text-gray-400">{book.authors?.join(", ")}</div>
          </div>

          <div className="flex flex-row justify-between">
            <Rating
              key={ratingValue}
              fillColor="#f8f1d3"
              allowFraction
              size={26}
              readonly={readonly}
              initialValue={
                typeof ratingValue == "number" ? ratingValue / 2 : undefined
              }
              onClick={(value) => {
                value = value * 2;
                if (ratingValue == value) {
                  patch({ rating: undefined });
                } else {
                  patch({ rating: { value, createdAt: now() } });
                }
              }}
              emptyStyle={{ display: "flex" }}
              emptyClassName="opacity-10"
              SVGstyle={{ display: "inline-block", marginBottom: 10 }}
              style={{ marginBottom: -10 }}
            />
            {!readonly && noteDraft == null && (
              <Button onClick={() => setNoteDraft(rel?.note?.value ?? "")}>
                {rel?.note ? "Edit" : "Add"} note
              </Button>
            )}
          </div>

          {isbns.length > 0 && (
            <span className="mt-auto ml-auto text-sm text-gray-500">
              ISBN{isbns.length > 1 && "s"}: {isbns.join(", ")}
            </span>
          )}
        </div>
      </CardSection>
      {noteDraft != null ? (
        <CardSection className="flex flex-col gap-4">
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
        </CardSection>
      ) : (
        rel?.note && (
          <CardSection>
            <h3 className="text-gray-500 text-sm font-semibold">Note</h3>
            {rel.note.value}
          </CardSection>
        )
      )}
    </SectionedCard>
  );
}
