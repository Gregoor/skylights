import cx from "classix";
import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import React, { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { entries, fromEntries, groupBy } from "remeda";

import { authClient, getSessionAgent } from "@/auth";
import { db } from "@/db";
import { relsT } from "@/db/schema";
import { fetchItemsInfo, RelRecordValue } from "@/items/utils";
import { Card } from "@/ui";
import { getPublicAgent } from "@/utils";

import { Memput, ReviewCarousel, SubmitButton } from "./client";

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
          <Memput
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
