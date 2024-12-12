import { count, eq } from "drizzle-orm";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { cache } from "react";
import { fromEntries } from "remeda";

import { getSessionAgent } from "@/auth";
import { db } from "@/db";
import { relsT } from "@/db/schema";
import { RelsProvider } from "@/rels/ctx";
import { importRepo, resolveHandle } from "@/rels/utils";
import { Card, LinkButton } from "@/ui";
import { getPublicAgent } from "@/utils";

import { findRelsWithBooks, RelsOrderBy } from "./actions";
import { Avatar } from "./client";
import { RelList } from "./RelList";
import { PAGE_SIZE } from "./share";

type Params = Promise<{
  handle: string;
}>;

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
  searchParams: Promise<{ orderBy?: RelsOrderBy }>;
}) {
  let { handle } = await params;
  handle = decodeURIComponent(handle);

  const profile = await getProfile(handle);

  if (profile.handle != handle) {
    redirect(`/profile/${profile.handle}`);
  }

  const agent = await getSessionAgent();
  const did = await resolveHandle(handle);

  await importRepo(did);

  const orderBy = (await searchParams).orderBy ?? "best";
  const [[{ count: totalRels }], { rels, booksByEditionKey }] =
    await Promise.all([
      db.select({ count: count() }).from(relsT).where(eq(relsT.did, did)),
      findRelsWithBooks(did, { limit: PAGE_SIZE, offset: 0, orderBy }),
    ]);

  const isOwnProfile =
    agent &&
    (await agent.getProfile({ actor: agent.assertDid })).data.handle == handle;

  return (
    <RelsProvider
      key={orderBy}
      initialRels={fromEntries(rels.map((r) => [r.key, r.value]))}
    >
      <div className="flex flex-col gap-4">
        <Card sectionClassName="flex flex-row items-center gap-2">
          {profile.avatar && (
            <a
              className="hover:opacity-80"
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
            <span className="font-semibold">{totalRels}</span> books.
          </div>
        </Card>
        <div className="flex flex-row items-center gap-2">
          Order by
          <LinkButton href="?orderBy=best" active={orderBy == "best"}>
            Best
          </LinkButton>
          <LinkButton href="?orderBy=recent" active={orderBy == "recent"}>
            Recent
          </LinkButton>
        </div>
        <RelList
          key={orderBy}
          did={did}
          readonly={!isOwnProfile}
          booksByEditionKey={booksByEditionKey}
          total={totalRels}
          orderBy={orderBy}
        />
      </div>
    </RelsProvider>
  );
}
