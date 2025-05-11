import { ProfileViewDetailed } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import { and, eq, sql } from "drizzle-orm";
import { Metadata } from "next";
import Link from "next/link";
import { fromEntries, mapValues, partition, values } from "remeda";

import { getSessionAgent } from "@/auth";
import { AvatarLink } from "@/AvatarLink";
import { db } from "@/db";
import { BOOK_KEY } from "@/items/BookCard";
import { RelsProvider } from "@/items/ctx";
import { getBasicItemFields } from "@/items/info";
import { ItemCard } from "@/items/ItemCard";
import { RatingSlider } from "@/items/RatingSlider";
import { MOVIE_KEY, SHOW_KEY } from "@/items/tmdb";
import { fetchItemsInfo, RelRecordValue } from "@/items/utils";
import { CardSection, SectionedCard } from "@/ui";
import { getPublicAgent, timeSince } from "@/utils";

type Params = Promise<{
  ref: string;
  value: string;
}>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const item = mapValues(await params, decodeURIComponent);
  const info = await fetchItemsInfo([item]);
  const fields = getBasicItemFields(item, info);
  if (!fields) return { title: "Skylights" };
  return {
    title: fields.title,
    openGraph: {
      description: `Visit Skylights to read the reviews and add your own`,
      ...{
        [BOOK_KEY]: {
          authors: values(info.books).at(0)?.author_name?.join(", "),
        },
        [MOVIE_KEY]: {},
        [SHOW_KEY]: {},
      }[item.ref],
      images: `https://ceaugysdma.cloudimg.io/${fields.imageURL}?width=1200&height=630&gravity=smart`,
    },
  };
}

export default async function RefPage({ params }: { params: Params }) {
  const item = mapValues(await params, decodeURIComponent);
  const agent = await getSessionAgent(false);
  const [info, allRels, profile] = await Promise.all([
    fetchItemsInfo([item]),
    db.query.relsT.findMany({
      where: and(
        eq(sql`value->'item'->>'ref'`, item.ref),
        eq(sql`value->'item'->>'value'`, item.value),
      ),
    }),
    agent?.getProfile({ actor: agent.assertDid }),
  ]);
  const [ownRels, otherRels] = partition(
    allRels.map((r) => ({ ...r, value: r.value as RelRecordValue })),
    (r) => r.did == agent?.did,
  );

  let profiles: ProfileViewDetailed[] = [];
  if (otherRels.length > 0) {
    const { data } = await getPublicAgent().getProfiles({
      actors: otherRels.map((r) => r.did!),
    });
    profiles = data.profiles;
  }
  const profilesByDid = fromEntries(profiles.map((p) => [p.did, p]));

  return (
    <>
      <RelsProvider
        initialRels={fromEntries(
          ownRels.map((r) => [r.key!, r.value as RelRecordValue]),
        )}
      >
        <ItemCard
          info={info}
          item={item}
          readonly={!agent}
          profileHandle={profile?.data?.handle}
        >
          {!agent && (
            <div className="mt-4">
              <Link
                href={`/?returnTo=/reviews/${item.ref}/${item.value}`}
                className="underline hover:opacity-80"
              >
                Login
              </Link>{" "}
              to add your review
            </div>
          )}
        </ItemCard>
      </RelsProvider>
      {otherRels.map((rel) => {
        const profile = profilesByDid[rel.did!];
        const ago = rel.reviewedAt ? timeSince(rel.reviewedAt) : undefined;
        return (
          <SectionedCard key={rel.did! + rel.key!}>
            <CardSection className="flex flex-row items-center gap-2">
              <AvatarLink smol profile={profile} />
              <div className="flex flex-row gap-1 flex-wrap">
                <Link href={`/profile/${profile.handle}`} className="w-fit">
                  <span className="hover:underline">{profile.displayName}</span>{" "}
                  <span className="text-gray-400 inline-flex flex-row">
                    @{profile.handle}
                  </span>
                </Link>
                <Link
                  href={`/profile/${profile.handle}/review/${item.ref}/${item.value}`}
                  className="ml-auto inline-flex flex-row text-gray-400 hover:opacity-80"
                >
                  {ago && " · " + ago}
                  {rel.value.rating && (
                    <span className="ml-3">
                      <RatingSlider
                        value={rel.value.rating?.value}
                        disabled
                        smol
                      />
                    </span>
                  )}
                </Link>
              </div>
            </CardSection>
            {rel.value.note && (
              <CardSection>{rel.value.note.value}</CardSection>
            )}
          </SectionedCard>
        );
      })}
    </>
  );
}
