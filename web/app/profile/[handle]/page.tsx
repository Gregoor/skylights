import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cache } from "react";
import { fromEntries, groupBy, prop } from "remeda";

import { getSessionAgent } from "@/auth";
import { RelsProvider } from "@/rels/RelsCtx";
import { fetchBooks, listRels } from "@/rels/utils";
import { Card } from "@/ui";
import { getPublicAgent } from "@/utils";

import { Avatar } from "./client";
import { RelList } from "./RelList";

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
  const rels = await listRels(handle);
  return {
    title: `${profile.displayName ?? profile.handle}'s reviews`,
    openGraph: {
      description: `Visit Skylights to see their ${rels.length} reviews`,
    },
  };
}

export default async function ProfilePage({ params }: { params: Params }) {
  let { handle } = await params;
  handle = decodeURIComponent(handle);

  const profile = await getProfile(handle);

  if (profile.handle != handle) {
    redirect(`/profile/${profile.handle}`);
  }

  const agent = await getSessionAgent();
  const rels = await listRels(handle);
  const books = await fetchBooks(
    rels
      .filter((r) => r.value.item.ref == "open-library")
      .map((r) => r.value.item.value),
  );
  const booksByEditionKey = groupBy(books, prop("edition_key"));
  const isOwnProfile =
    agent &&
    (await agent.getProfile({ actor: agent.assertDid })).data.handle == handle;

  return (
    <RelsProvider initialRels={fromEntries(rels.map((r) => [r.uri, r.value]))}>
      <div className="flex flex-col gap-4">
        {agent ? (
          <Link
            className="w-full text-center underline hover:opacity-80"
            href="/search"
          >
            Go to Search
          </Link>
        ) : (
          <Link
            className="w-full text-center underline hover:opacity-80"
            href="/"
          >
            Login
          </Link>
        )}
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
            <span className="font-semibold">{rels.length}</span> books:
          </div>
        </Card>
        <RelList
          readonly={!isOwnProfile}
          booksByEditionKey={booksByEditionKey}
        />
      </div>
    </RelsProvider>
  );
}
