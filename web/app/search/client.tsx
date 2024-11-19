"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function SearchInput({ defaultValue }: { defaultValue: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  return (
    <input
      type="text"
      className="bg-transparent border p-1"
      defaultValue={defaultValue}
      onChange={(event) => {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set("query", event.target.value);
        router.push("/search?" + newSearchParams.toString());
      }}
    />
  );
}

export function ImgWithDummy(props: React.ComponentProps<"img">) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div className="border-2 h-full flex items-center justify-center text-gray-300">
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
