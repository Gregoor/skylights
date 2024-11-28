import Link from "next/link";
import { fromEntries, groupBy, prop } from "remeda";

import { getSessionAgent } from "@/auth";
import { RelsProvider } from "@/rels/RelsCtx";
import { fetchBooks, listRels } from "@/rels/utils";
import { Card } from "@/ui";
import { getBskyAgent as getPublicAgent } from "@/utils";

import { deleteAll } from "./actions";
import { Avatar } from "./client";
import { RelList } from "./RelList";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const agent = await getSessionAgent();
  const rels = agent ? await listRels() : [];
  const books = await fetchBooks(
    rels
      .filter((r) => r.value.item.ref == "open-library")
      .map((r) => r.value.item.value),
  );
  const booksByEditionKey = groupBy(books, prop("edition_key"));
  const isOwnProfile =
    agent &&
    (await agent.getProfile({ actor: agent.assertDid })).data.handle == handle;
  const { data: profile } = await getPublicAgent().getProfile({
    actor: handle,
  });
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
        <Card className="flex flex-row items-center gap-2">
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
        {process.env.NODE_ENV != "production" && (
          <form action={deleteAll}>
            <button type="submit">Clear</button>
          </form>
        )}
        <RelList booksByEditionKey={booksByEditionKey} />
      </div>
    </RelsProvider>
  );
}
