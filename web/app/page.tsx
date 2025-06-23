import { db } from "@sl/shared/db";
import { relsT } from "@sl/shared/db/schema";
import { desc } from "@sl/shared/drizzle-orm";
import React, { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { entries, fromEntries, groupBy } from "remeda";

import { getSessionAgent } from "@/auth";
import { fetchItemsInfo, RelRecordValue } from "@/items/utils";
import { Card } from "@/ui";
import { getPublicAgent } from "@/utils";

import { ReviewCarousel, SignInCard } from "./client";

async function RecentReviews() {
  "use cache";
  const agent = getPublicAgent();

  const rows = await db
    .select()
    .from(relsT)
    .groupBy(relsT.did, relsT.key)
    .orderBy(desc(relsT.reviewedAt))
    .limit(100);
  const rels = rows.map((row) => ({
    ...row,
    key: row.key!,
    value: row.value as RelRecordValue,
  }));

  const actors = new Set(
    rels.map((r) => r.did?.trim()).filter((d): d is string => !!d),
  );
  const {
    data: { profiles },
  } = await agent.getProfiles({
    actors: [...actors],
  });

  const info = await fetchItemsInfo(
    rels.map((r) => r.value.item).filter(Boolean),
  );
  const profilesByDid = fromEntries(profiles.map((p) => [p.did, p]));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {entries(groupBy(rels, (r) => r.did!)).map(([did, rels]) => {
        const reviewer = profilesByDid[did];
        if (!reviewer) return null;
        return (
          <ReviewCarousel
            key={did}
            profile={reviewer}
            rels={rels}
            info={info}
          />
        );
      })}
    </div>
  );
}

export default async function LandingPage() {
  const agent = await getSessionAgent(false);

  return (
    <div className="flex flex-col gap-4">
      {!agent && <SignInCard />}

      <Card>
        <div className="mb-2 text-center">
          <h1 className="text-lg">All your public reviews, in one place</h1>
        </div>
        <p>
          One platform for all your reviews. At the moment that includes books,
          movies and TV shows.
          <br />
          Next up: Papers and URLs.
          <br />
          <br />
          Your data is yours, and not locked into a silo like on other
          platforms, thanks to ATProto (the protocol behind Bluesky).
        </p>
        <hr className="my-3 border-gray-700" />
        <div className="flex flex-row gap-2 justify-between text-sm">
          <a
            href="https://github.com/Gregoor/skylights"
            className="underline hover:no-underline"
          >
            View Source / Report Issues
          </a>
          <div>
            Made by{" "}
            <a
              href="https://bsky.app/profile/watwa.re"
              className="underline hover:no-underline"
            >
              @watwa.re
            </a>
          </div>
        </div>
      </Card>

      <ErrorBoundary fallback={null}>
        <Suspense>
          <RecentReviews />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
