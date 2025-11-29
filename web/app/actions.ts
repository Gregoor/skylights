"use server";

import { redirect } from "next/navigation";

import { assertSessionAgent, authClient, AuthState } from "@/auth";

export async function login(handle: string, returnTo?: string | null) {
  let url: string | undefined;
  try {
    url = (
      await authClient.authorize(handle.toString(), {
        ui_locales: "en",
        state: JSON.stringify(
          (returnTo ? { returnTo } : {}) satisfies AuthState,
        ),
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

const LIST_MAPPINGS = {
  "my.skylights.listItem#inProgress": { name: "Currently Watching", type: "watching" },
  "my.skylights.listItem#queue": { name: "Watchlist", type: "watchlist" },
  "my.skylights.listItem#abandoned": { name: "Abandoned", type: "abandoned" },
  "my.skylights.listItem#owned": { name: "Owned", type: "owned" },
  "my.skylights.listItem#wishlist": { name: "Wishlist", type: "wishlist" },
} as const;

function parseItemRef(ref: string, value: string) {
  if (ref === "tmdb:m") return { identifiers: { tmdbId: value }, creativeWorkType: "movie" as const };
  if (ref === "tmdb:s") return { identifiers: { tmdbId: value }, creativeWorkType: "tv" as const };
  if (ref === "open-library") return { identifiers: { openLibraryId: value }, creativeWorkType: "book" as const };
  return null;
}

async function fetchISBNFromOpenLibrary(olid: string): Promise<{ isbn10?: string; isbn13?: string } | null> {
  try {
    const response = await fetch(`https://openlibrary.org/books/${olid}.json`);
    if (!response.ok) return null;

    const data = await response.json();

    if (data.isbn_10?.[0] || data.isbn_13?.[0]) {
      return {
        isbn10: data.isbn_10?.[0],
        isbn13: data.isbn_13?.[0],
      };
    }

    if (data.works?.[0]?.key) {
      const workKey = data.works[0].key;
      const editionsResponse = await fetch(`https://openlibrary.org${workKey}/editions.json?limit=50`);
      if (editionsResponse.ok) {
        const editionsData = await editionsResponse.json();
        for (const edition of editionsData.entries || []) {
          if (edition.isbn_10?.[0] || edition.isbn_13?.[0]) {
            return {
              isbn10: edition.isbn_10?.[0],
              isbn13: edition.isbn_13?.[0],
            };
          }
        }
      }
    }

    return null;
  } catch (_error) {
    return null;
  }
}

type MigrationLog = {
  type: "info" | "success" | "error" | "warning";
  message: string;
};

export async function* migrateToPopfeed(clear: boolean): AsyncGenerator<MigrationLog> {
  try {
    const agent = await assertSessionAgent();
    const did = agent.assertDid;

    yield { type: "info", message: "🔐 Using authenticated session..." };
    yield { type: "success", message: `✅ Authenticated` };

    // Clear existing Popfeed data if requested
    if (clear) {
      yield { type: "info", message: "🗑️  Clearing existing Popfeed data..." };

      const collections = [
        "social.popfeed.feed.list",
        "social.popfeed.feed.listItem",
        "social.popfeed.feed.review",
      ];

      for (const collection of collections) {
        let cursor: string | undefined;
        let deletedCount = 0;

        do {
          const response = await agent.com.atproto.repo.listRecords({
            repo: did,
            collection,
            limit: 100,
            cursor,
          });

          for (const record of response.data.records) {
            const rkey = record.uri.split("/").pop()!;
            await agent.com.atproto.repo.deleteRecord({
              repo: did,
              collection,
              rkey,
            });
            deletedCount++;
          }

          cursor = response.data.cursor;
        } while (cursor);

        if (deletedCount > 0) {
          yield { type: "success", message: `  ✅ Deleted ${deletedCount} records from ${collection}` };
        }
      }
    }

    // Fetch existing Skylights data from PDS
    yield { type: "info", message: "📥 Fetching Skylights data from PDS..." };

    const listItems = [];
    let cursor: string | undefined;
    do {
      const response = await agent.com.atproto.repo.listRecords({
        repo: did,
        collection: "my.skylights.listItem",
        limit: 100,
        cursor,
      });
      listItems.push(...response.data.records);
      cursor = response.data.cursor;
    } while (cursor);

    const rels = [];
    cursor = undefined;
    do {
      const response = await agent.com.atproto.repo.listRecords({
        repo: did,
        collection: "my.skylights.rel",
        limit: 100,
        cursor,
      });
      rels.push(...response.data.records);
      cursor = response.data.cursor;
    } while (cursor);

    yield { type: "info", message: `  Found ${listItems.length} list items` };
    yield { type: "info", message: `  Found ${rels.length} rel records` };

    // Create Popfeed lists
    yield { type: "info", message: "📋 Creating Popfeed lists..." };
    const lists = new Map<string, string>();

    for (const [token, { name, type }] of Object.entries(LIST_MAPPINGS)) {
      const response = await agent.com.atproto.repo.createRecord({
        repo: did,
        collection: "social.popfeed.feed.list",
        record: {
          $type: "social.popfeed.feed.list",
          name,
          listType: type,
          createdAt: new Date().toISOString(),
          ordered: false,
          tags: [],
        },
      });
      lists.set(token, response.data.uri);
      yield { type: "success", message: `  ✅ ${name}` };
    }

    // Migrate list items
    yield { type: "info", message: "📦 Migrating list items..." };
    let migrated = 0, skipped = 0;
    const skipReasons: Record<string, number> = {};

    for (const record of listItems) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const value = record.value as any;

      let listToken = value.list?.$type;
      if (listToken === "my.skylights.listItem#builtin" && value.list?.type?.type) {
        listToken = value.list.type.type;
      }

      if (!listToken || !lists.has(listToken)) {
        skipReasons[`custom/unknown list: ${listToken || 'none'}`] = (skipReasons[`custom/unknown list: ${listToken || 'none'}`] || 0) + 1;
        skipped++;
        continue;
      }

      const parsed = parseItemRef(value.item.ref, value.item.value);
      if (!parsed) {
        skipReasons[`unknown ref: ${value.item.ref}`] = (skipReasons[`unknown ref: ${value.item.ref}`] || 0) + 1;
        skipped++;
        continue;
      }

      if (parsed.creativeWorkType === "book") {
        const olid = parsed.identifiers.openLibraryId as string;
        const isbns = await fetchISBNFromOpenLibrary(olid);
        if (!isbns || (!isbns.isbn10 && !isbns.isbn13)) {
          yield { type: "warning", message: `  ⚠️  No ISBN found for book: ${olid} (likely self-published or very old)` };
          skipReasons['books without ISBN (self-published/old)'] = (skipReasons['books without ISBN (self-published/old)'] || 0) + 1;
          skipped++;
          continue;
        }
        parsed.identifiers = isbns as typeof parsed.identifiers;
      }

      await agent.com.atproto.repo.createRecord({
        repo: did,
        collection: "social.popfeed.feed.listItem",
        record: {
          $type: "social.popfeed.feed.listItem",
          ...parsed,
          listUri: lists.get(listToken)!,
          listType: LIST_MAPPINGS[listToken as keyof typeof LIST_MAPPINGS].type,
          addedAt: value.addedAt || new Date().toISOString(),
        },
      });
      migrated++;
    }
    yield { type: "success", message: `  ✅ ${migrated} migrated, ${skipped} skipped` };
    if (Object.keys(skipReasons).length > 0) {
      yield { type: "info", message: `  Skip reasons:` };
      for (const [reason, count] of Object.entries(skipReasons)) {
        yield { type: "info", message: `    - ${reason}: ${count}` };
      }
    }

    // Migrate reviews
    yield { type: "info", message: "⭐ Migrating reviews..." };
    migrated = 0;
    skipped = 0;

    for (const record of rels) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const value = record.value as any;

      if (!value.rating && !value.note) {
        skipped++;
        continue;
      }

      const parsed = parseItemRef(value.item.ref, value.item.value);
      if (!parsed) {
        skipped++;
        continue;
      }

      if (parsed.creativeWorkType === "book") {
        const olid = parsed.identifiers.openLibraryId as string;
        const isbns = await fetchISBNFromOpenLibrary(olid);
        if (!isbns || (!isbns.isbn10 && !isbns.isbn13)) {
          yield { type: "warning", message: `  ⚠️  No ISBN found for review: ${olid} (likely self-published or very old)` };
          skipped++;
          continue;
        }
        parsed.identifiers = isbns as typeof parsed.identifiers;
      }

      await agent.com.atproto.repo.createRecord({
        repo: did,
        collection: "social.popfeed.feed.review",
        record: {
          $type: "social.popfeed.feed.review",
          ...parsed,
          rating: value.rating?.value,
          text: value.note?.value || "",
          createdAt: value.rating?.createdAt || value.note?.createdAt || new Date().toISOString(),
          isRevisit: (value.finishedAt?.length || 0) > 1,
          containsSpoilers: false,
          tags: [],
        },
      });
      migrated++;
    }
    yield { type: "success", message: `  ✅ ${migrated} migrated, ${skipped} skipped` };

    yield { type: "success", message: "🎉 Migration complete!" };
  } catch (error) {
    yield { type: "error", message: `❌ Error: ${error instanceof Error ? error.message : String(error)}` };
  }
}
