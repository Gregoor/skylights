import { db } from "@sl/shared/db";
import { relsT } from "@sl/shared/db/schema";
import { and, eq, sql } from "@sl/shared/drizzle-orm";
import { importRepo } from "@sl/shared/utils";
import { Metadata } from "next";
import { mapValues, values } from "remeda";

import { getSessionAgent } from "@/auth";
import { BOOK_KEY } from "@/items/BookCard";
import { RelsProvider } from "@/items/ctx";
import { Info } from "@/items/info";
import { ItemCard } from "@/items/ItemCard";
import { MOVIE_KEY, SHOW_KEY } from "@/items/tmdb";
import { fetchItemsInfo, RelRecordValue, resolveHandle } from "@/items/utils";
import { Item } from "@/lexicon/types/my/skylights/defs";
import { getPublicAgent, timeSince } from "@/utils";

type Params = Promise<{
  handle: string;
  ref: string;
  value: string;
}>;

function getOG_Fields(item: Item, info: Info) {
  switch (item.ref) {
    case BOOK_KEY: {
      const book = info.books[item.value];
      return book
        ? {
            title: book.title,
            imageURL: `https://covers.openlibrary.org/b/olid/${book.editions.docs.at(0)?.key.split("/").at(2)}-L.jpg`,
          }
        : null;
    }
    case MOVIE_KEY: {
      const movie = info.movies[Number(item.value)];
      return movie
        ? {
            title: `${movie.title} (${new Date(movie.release_date).getFullYear()})`,
            imageURL: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
          }
        : null;
    }
    case SHOW_KEY: {
      const show = info.shows[Number(item.value)];
      return show
        ? {
            title: `${show.name} (${new Date(show.first_air_date).getFullYear()})`,
            imageURL: `https://image.tmdb.org/t/p/w500${show.poster_path}`,
          }
        : null;
    }
    default:
      return null;
  }
}

function findRel(did: string, item: Item) {
  return db.query.relsT.findFirst({
    where: and(
      eq(relsT.did, did),
      eq(sql`value->'item'->>'ref'`, item.ref),
      eq(sql`value->'item'->>'value'`, item.value),
    ),
  });
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { handle, ...item } = mapValues(await params, decodeURIComponent);
  const [did] = await Promise.all([
    resolveHandle(handle),
    importRepo(await resolveHandle(handle)),
  ]);

  const [info, rel] = await Promise.all([
    fetchItemsInfo([item]),
    findRel(did, item),
  ]);
  const fields = getOG_Fields(item, info);
  if (!fields || !rel) return { title: "Skylights" };
  const value = rel.value as RelRecordValue;
  const ratingString = value.rating
    ? " " +
      "⭐️".repeat(Math.floor(value.rating.value / 2)) +
      (value.rating.value % 2 ? "½" : "")
    : "";
  return {
    title: `@${handle}'s ${ratingString} review of "${fields.title}"`,
    openGraph: {
      description: value.note?.value,
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

export default async function RelPage({ params }: { params: Params }) {
  const { handle, ...item } = mapValues(await params, decodeURIComponent);
  const did = await resolveHandle(handle);
  await importRepo(did);
  const [info, rel, agent, reviewer] = await Promise.all([
    fetchItemsInfo([item]),
    findRel(did, item),
    getSessionAgent(false),
    await getPublicAgent().getProfile({ actor: did }),
  ]);

  if (!rel) {
    return <div>Not found</div>;
  }

  return (
    <>
      <RelsProvider initialRels={{ [rel.key!]: rel.value as RelRecordValue }}>
        <ItemCard
          info={info}
          item={item}
          readonly={!agent}
          reviewer={reviewer.data}
          ago={rel.reviewedAt ? timeSince(rel.reviewedAt) : undefined}
        />
      </RelsProvider>
    </>
  );
}
