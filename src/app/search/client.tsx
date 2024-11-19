"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function SearchInput({ defaultValue }: { defaultValue: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  return (
    <input
      type="text"
      className="bg-transparent border"
      defaultValue={defaultValue}
      onChange={(event) => {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set("query", event.target.value);
        router.push("/search?" + newSearchParams.toString());
      }}
    />
  );
}
