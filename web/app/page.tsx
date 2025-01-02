import cx from "classix";
import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { fromEntries } from "remeda";

import { authClient, getSessionAgent } from "@/auth";
import { db } from "@/db";
import { relsT } from "@/db/schema";
import { RelsProvider } from "@/rels/ctx";
import { RelCard } from "@/rels/RelCard";
import { fetchItemsInfo, RelRecordValue } from "@/rels/utils";
import { Card } from "@/ui";
import { getPublicAgent, timeSince } from "@/utils";

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

  const info = await fetchItemsInfo(
    rels.map((r) => r.value.item).filter(Boolean),
  );
  const profilesByDid = fromEntries(profiles.map((p) => [p.did, p]));

  return (
    <RelsProvider initialRels={fromEntries(rels.map((r) => [r.key, r.value]))}>
      {rels.map((rel) => {
        const reviewer = rel.did && profilesByDid[rel.did];
        if (!reviewer) return null;
        return (
          <RelCard
            key={rel.key}
            item={rel.value.item}
            readonly={reviewer.did != sessionAgent?.did}
            ago={rel.reviewedAt ? timeSince(rel.reviewedAt) : undefined}
            {...{ info, reviewer }}
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
