import { redirect } from "next/navigation";

import { getSessionAgent } from "@/auth";
import { RelsProvider } from "@/items/ctx";

import { ClientSearchPage } from "./client";
import { SEARCH_TYPES, SearchType } from "./utils";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { type } = await params;
  const { q } = await searchParams;

  if (!(await getSessionAgent(false))) {
    redirect(`/?returnTo=/search/${type}?q=${q}`);
  }

  if (!SEARCH_TYPES.includes(type as never)) {
    redirect(`/search?q=${q}`);
  }
  return (
    <RelsProvider>
      <ClientSearchPage searchType={type as SearchType} query={q} />
    </RelsProvider>
  );
}
