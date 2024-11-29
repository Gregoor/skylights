import Link from "next/link";
import { redirect } from "next/navigation";
import { fromEntries, groupBy, prop } from "remeda";

import { getSessionAgent } from "@/auth";
import { RelsProvider } from "@/rels/RelsCtx";
import { fetchBooks, listRels } from "@/rels/utils";
import { Card } from "@/ui";
import { getPublicAgent } from "@/utils";

import { Avatar } from "./client";
import { RelList } from "./RelList";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  let { handle } = await params;
  handle = decodeURIComponent(handle);

  console.log({ handle });
  const { data: profile } = await getPublicAgent().getProfile({
    actor: handle,
  });

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
          {profile?.avatar && <Avatar src={profile.avatar} />}
          <div>
            Books reviewed by {isOwnProfile && "you ("}
            <a
              className="underline hover:opacity-80"
              href={`https://bsky.app/profile/${handle}`}
              target="_blank"
            >
              {handle}
            </a>
            {isOwnProfile && ")"}
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
