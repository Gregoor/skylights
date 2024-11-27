import Link from "next/link";

import { getSessionAgent } from "@/auth";
import { listRels } from "@/books/utils";

import { deleteAll } from "./actions";
import { RelList } from "./RelList";
import { Card } from "@/ui";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const [rels, agent] = await Promise.all([
    listRels(handle),
    getSessionAgent(false),
  ]);
  const isOwnProfile =
    (await agent?.getProfile({ actor: agent.assertDid }))?.data.handle ==
    handle;
  return (
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
      <Card>
        Books reviewed by {isOwnProfile && "you ("}
        <a
          className="underline hover:opacity-80"
          href={`https://bsky.app/profile/${handle}`}
          target="_blank"
        >
          {handle}
        </a>
        {isOwnProfile && ")"}
      </Card>
      {isOwnProfile && process.env.NODE_ENV != "production" && (
        <form action={deleteAll}>
          <button type="submit">Clear</button>
        </form>
      )}
      <RelList items={rels} isOwnProfile={isOwnProfile} />
    </div>
  );
}
