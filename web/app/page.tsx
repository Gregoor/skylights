import { ProfileView } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import cx from "classix";
import { desc, inArray, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { fromEntries } from "remeda";

import { assertSessionAgent, authClient, getSessionAgent } from "@/auth";
import { db } from "@/db";
import { relsT } from "@/db/schema";
import { BookCard } from "@/rels/BookCard";
import { RelsProvider } from "@/rels/ctx";
import { fetchBooks, RelRecordValue } from "@/rels/utils";
import { Card } from "@/ui";
import { getPublicAgent } from "@/utils";

import { SubmitButton } from "./client";

async function login(formData: FormData) {
  "use server";
  const handle = formData.get("handle");
  if (!handle) {
    return;
  }
  let url: string | undefined;
  try {
    url = (
      await authClient.authorize(handle.toString(), {
        ui_locales: "en",
      })
    ).toString();
    console.log("redirecting to", url);
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.error("authorize errror ✨", error, (error as any).payload);
  }
  if (url) {
    redirect(url);
  }
}

function SignInCard() {
  return (
    <Card
      className="mx-auto w-full max-w-sm"
      sectionClassName="flex flex-col gap-2"
    >
      <h1 className="text-lg">Sign-in with Bluesky</h1>
      <form className="flex flex-row gap-2" action={login}>
        <label
          className={cx(
            "group border rounded-lg border-gray-400 focus-within:border-white",
            "transition-all w-full flex flex-row bg-black",
          )}
        >
          <div
            className={cx(
              "border-r border-gray-400 px-2 flex items-center text-gray-400",
              "group-focus-within:border-white group-focus-within:text-white",
              "transition-all text-sm",
            )}
          >
            @
          </div>
          <input
            type="text"
            name="handle"
            placeholder="Handle"
            autoCorrect="off"
            autoComplete="off"
            className={cx("outline-none", "p-2 w-full bg-transparent")}
          />
        </label>
        <SubmitButton />
      </form>
    </Card>
  );
}

function timeSince(date: Date) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seconds = Math.floor(((new Date() as any) - (date as any)) / 1000);
  let interval = seconds / 31536000;

  if (interval > 1) {
    return date.toISOString().split("T")[0];
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + "mo";
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + "d";
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + "h";
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + "m";
  }
  return Math.floor(seconds) + "s";
}

async function RecentReviews() {
  const sessionAgent = await getSessionAgent(false);
  const agent = getPublicAgent();

  const rows = await db.query.relsT.findMany({
    orderBy: desc(relsT.reviewedAt),
    limit: 20,
  });
  const rels = rows.map((row) => ({
    ...row,
    key: row.key!,
    value: row.value as RelRecordValue,
  }));

  const {
    data: { profiles },
  } = await agent.getProfiles({ actors: rels.map((r) => r.did!) });

  const books = await fetchBooks(rels.map((r) => r.value));
  const booksByEditionKey = fromEntries(
    books.map((book) => [book.edition_key, book]),
  );
  const profilesByDid = fromEntries(profiles.map((p) => [p.did, p]));

  return (
    <RelsProvider initialRels={fromEntries(rels.map((r) => [r.key, r.value]))}>
      {rels.map((rel) => {
        const editionKey = rel.value.item.value;
        const reviewer = rel.did && profilesByDid[rel.did];
        const book = editionKey ? booksByEditionKey[editionKey] : undefined;
        if (!book || !reviewer) return null;
        return (
          <BookCard
            key={rel.key}
            readonly={reviewer.did != sessionAgent?.did}
            ago={rel.reviewedAt ? timeSince(rel.reviewedAt) : undefined}
            {...{ book, reviewer }}
          />
        );
      })}
    </RelsProvider>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function FollowsReviews() {
  const agent = await assertSessionAgent();
  const follows: ProfileView[] = [];
  let cursor;
  for (let i = 0; i < 5; i++) {
    const { data } = await agent!.app.bsky.graph.getFollowers({
      actor: agent!.assertDid,
      cursor,
      limit: 100,
    });
    cursor = data.cursor;
    follows.push(...data.followers);
  }

  // for (const follow of follows) {
  //   await importRepo(follow.did);
  // }

  const followsByDid = fromEntries(follows.map((f) => [f.did, f]));

  const rows = await db.query.relsT.findMany({
    where: inArray(
      relsT.did,
      follows.map((f) => f.did),
    ),
    orderBy: desc(sql`value->'rating'->'value'`),
    limit: 10,
  });
  const rels = rows.map((row) => ({
    ...row,
    key: row.key!,
    value: row.value as RelRecordValue,
  }));

  const books = await fetchBooks(rels.map((r) => r.value));
  const booksByEditionKey = fromEntries(
    books.map((book) => [book.edition_key, book]),
  );

  return (
    <RelsProvider initialRels={fromEntries(rels.map((r) => [r.key, r.value]))}>
      {rels.map((rel) => {
        const editionKey = rel.value.item.value;
        const reviewer = rel.did && followsByDid[rel.did];
        const book = editionKey ? booksByEditionKey[editionKey] : undefined;
        if (!book || !reviewer) return null;
        return (
          <BookCard
            key={rel.key}
            readonly={reviewer.did != agent.did}
            {...{ book, reviewer }}
          />
        );
      })}
    </RelsProvider>
  );
}

export default async function LandingPage() {
  const agent = await getSessionAgent(false);

  return (
    <div className="flex flex-col gap-4">
      {!agent && <SignInCard />}

      <RecentReviews />
    </div>
  );
}
