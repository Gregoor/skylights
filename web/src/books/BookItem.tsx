"use client";
import { useAtom } from "jotai";
import { useState } from "react";
import { Rating } from "react-simple-star-rating";
import { omit } from "remeda";

import { Card } from "@/ui";

import { rate, unrate } from "./actions";
import { ratingsAtom } from "./atoms";

function ImgWithDummy(props: React.ComponentProps<"img">) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div className="border border-gray-400/50 h-full flex items-center justify-center text-gray-300">
        ?
      </div>
    );
  }

  return (
    <img
      {...props}
      onLoad={(event) => {
        setErrored((event.target as HTMLImageElement).naturalWidth == 1);
      }}
    />
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

export function BookItem({ value }: { value: Book }) {
  const isbns = [...value.isbn_13, ...value.isbn_10];
  const [ratings, setRatings] = useAtom(ratingsAtom);
  const rating = ratings[value.work_key] || undefined;
  return (
    <Card className="flex flex-row gap-4">
      <div className="flex-shrink-0 w-24 h-36 ">
        <ImgWithDummy
          key={value.edition_key}
          className="border border-gray-700/50 max-w-full max-h-full object-contain"
          alt={value.title}
          src={`https://covers.openlibrary.org/b/olid/${value.edition_key}-M.jpg`}
        />
      </div>
      <div className="w-full flex flex-col gap-2">
        <div>
          {value.title}
          <div className="text-gray-400">{value.authors?.join(", ")}</div>
        </div>

        <Rating
          key={rating}
          allowFraction
          size={26}
          initialValue={typeof rating == "number" ? rating / 2 : undefined}
          onClick={(newRating) => {
            newRating = newRating * 2;
            if (rating == newRating) {
              unrate(value.work_key);
              setRatings(omit(ratings, [value.work_key]));
            } else {
              rate(value.work_key, newRating);
              setRatings({ ...ratings, [value.work_key]: newRating });
            }
          }}
          emptyStyle={{ display: "flex" }}
          emptyClassName="opacity-10"
          SVGstyle={{ display: "inline-block", marginBottom: 10 }}
          style={{ marginBottom: -10 }}
        />

        {isbns.length > 0 && (
          <span className="mt-auto ml-auto text-sm text-gray-500">
            ISBN{isbns.length > 1 && "s"}: {isbns.join(", ")}
          </span>
        )}
      </div>
    </Card>
  );
}
