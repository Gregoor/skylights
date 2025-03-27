import { count, eq, sql } from "drizzle-orm";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { cache, Fragment } from "react";
import { sortBy } from "remeda";

import { getSessionAgent } from "@/auth";
import { db } from "@/db";
import { listItemsT, relsT } from "@/db/schema";
import { BOOK_KEY } from "@/items/BookCard";
import { RelsProvider } from "@/items/ctx";
import { MOVIE_KEY, SHOW_KEY } from "@/items/tmdb";
import { importRepo, resolveHandle } from "@/items/utils";
import { Card, LinkButton } from "@/ui";
import { getPublicAgent } from "@/utils";

import { RelsOrderBy } from "./actions";
import { Avatar, ListSelect } from "./client";
import { ItemList } from "./ItemList";

type Params = Promise<{ handle: string }>;

const getProfile = cache(async (handle: string) =>
  getPublicAgent()
    .getProfile({ actor: handle })
    .then((r) => r.data),
);

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { handle } = await params;
  const profile = await getProfile(handle);
  const name = profile.displayName ?? profile.handle;
  return {
    title: `${name}'s reviews`,
    openGraph: {
      description: `Visit Skylights to see ${name}'s reviews`,
    },
  };
}

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<{ list?: string; orderBy?: RelsOrderBy }>;
}) {
  let { handle } = await params;
  handle = decodeURIComponent(handle);

  const [profile, agent, did] = await Promise.all([
    getProfile(handle),
    getSessionAgent(),
    resolveHandle(handle),
  ]);

  if (profile.handle != handle) {
    redirect(`/profile/${profile.handle}`);
  }

  await importRepo(did);

  const { orderBy, list } = await searchParams;

  const [countsByMediaType, lists] = await Promise.all([
    db
      .select({ ref: sql`value->'item'->>'ref'`, count: count() })
      .from(relsT)
      .where(eq(relsT.did, did))
      .groupBy(sql`value->'item'->>'ref'`),
    db
      .select({
        key: sql<string>`value->'list'->'type'->>'type'`,
        count: count(),
      })
      .from(listItemsT)
      .where(eq(listItemsT.did, did))
      .groupBy(sql`value->'list'->'type'->>'type'`),
  ]);

  const isOwnProfile =
    agent &&
    (await agent.getProfile({ actor: agent.assertDid })).data.handle == handle;

  return (
    <RelsProvider key={orderBy}>
      <div className="flex flex-col gap-4">
        <Card sectionClassName="flex flex-row items-center gap-2">
          {profile.avatar && (
            <a
              className="flex-shrink-0 hover:opacity-80"
              href={`https://bsky.app/profile/${handle}`}
              target="_blank"
            >
              <Avatar src={profile.avatar} />
            </a>
          )}
          <div>
            <a
              className="underline hover:opacity-80"
              href={`https://bsky.app/profile/${handle}`}
              target="_blank"
            >
              {isOwnProfile ? "You" : (profile.displayName ?? profile.handle)}
            </a>{" "}
            {isOwnProfile ? "have" : "has"} reviewed{" "}
            {sortBy(countsByMediaType, (c) => -c.count).map((row, i) => (
              <Fragment key={row.ref as string}>
                <span className="font-semibold">{row.count}</span>{" "}
                {
                  {
                    [BOOK_KEY]: "book",
                    [MOVIE_KEY]: "movie",
                    [SHOW_KEY]: "show",
                  }[row.ref as string]
                }
                {row.count > 1 && "s"}
                {i < countsByMediaType.length - 1 &&
                  (i == countsByMediaType.length - 2 ? " and " : ", ")}
              </Fragment>
            ))}
            .
          </div>
        </Card>
        <div className="flex flex-row items-center gap-2">
          <ListSelect value={list} lists={lists} />
          {!list && (
            <>
              <span>ordered by</span>
              <LinkButton
                href={`?orderBy=best&list=${list ?? ""}`}
                active={!orderBy || orderBy == "best"}
              >
                Best
              </LinkButton>
              <LinkButton
                href={`?orderBy=recent&list=${list ?? ""}`}
                active={orderBy == "recent"}
              >
                Recent
              </LinkButton>
            </>
          )}
        </div>
        <ItemList
          key={JSON.stringify({ list, orderBy })}
          did={did}
          handle={handle}
          list={list}
          readonly={!isOwnProfile}
          info={{ books: {}, movies: {}, shows: {} }}
          orderBy={orderBy ?? "best"}
        />
      </div>
    </RelsProvider>
  );
}
