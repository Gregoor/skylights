"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { BUILT_IN_LISTS } from "@/utils";

export const Avatar = ({ src }: { src: string }) => (
  <img src={src} className="rounded-full w-12 h-12 flex-shrink-0" />
);

export function ListSelect({
  value,
  lists,
}: {
  value?: string;
  lists: { key: string; count: number }[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  return (
    <select
      className="focus:outline-dashed focus:outline-white border border-white p-1 bg-transparent"
      value={value ?? ""}
      onChange={(event) => {
        const newSearchParams = new URLSearchParams(searchParams);
        if (event.target.value) {
          newSearchParams.set("list", event.target.value);
        } else {
          newSearchParams.delete("list");
        }
        router.push(`?${newSearchParams.toString()}`);
      }}
    >
      <option value="">All reviewed</option>
      {lists.map((l) => {
        const key = l.key.split("#")[1] as keyof typeof BUILT_IN_LISTS;
        return (
          <option key={key} value={key}>
            {BUILT_IN_LISTS[key]} ({l.count})
          </option>
        );
      })}
    </select>
  );
}
