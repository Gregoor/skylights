"use client";

import { AtpAgent } from "@atproto/api";
import cx from "classix";
import { useState } from "react";

import { Card } from "@/ui";

type MigrationLog = {
  type: "info" | "success" | "error" | "warning";
  message: string;
};

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
  } catch (error) {
    console.error("Error fetching ISBN from OpenLibrary:", error);
    return null;
  }
}

async function runMigrationLogic(
  agent: AtpAgent,
  shouldClear: boolean,
  addLog: (type: MigrationLog["type"], message: string) => void
) {
  const did = agent.assertDid;

  addLog("info", "🔐 Using authenticated session...");
  addLog("success", `✅ Authenticated as ${did}`);

  // Clear existing Popfeed data if requested
  if (shouldClear) {
    addLog("info", "🗑️  Clearing existing Popfeed data...");

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
        addLog("success", `  ✅ Deleted ${deletedCount} records from ${collection}`);
      }
    }
  }

  // Fetch existing Skylights data from PDS
  addLog("info", "📥 Fetching Skylights data from PDS...");

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

  addLog("info", `  Found ${listItems.length} list items`);
  addLog("info", `  Found ${rels.length} rel records`);

  // Create Popfeed lists
  addLog("info", "📋 Creating Popfeed lists...");
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
    addLog("success", `  ✅ ${name}`);
  }

  // Migrate list items
  addLog("info", "📦 Migrating list items...");
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
        addLog("warning", `  ⚠️  No ISBN found for book: ${olid} (likely self-published or very old)`);
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
  addLog("success", `  ✅ ${migrated} migrated, ${skipped} skipped`);
  if (Object.keys(skipReasons).length > 0) {
    addLog("info", `  Skip reasons:`);
    for (const [reason, count] of Object.entries(skipReasons)) {
      addLog("info", `    - ${reason}: ${count}`);
    }
  }

  // Migrate reviews
  addLog("info", "⭐ Migrating reviews...");
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
        addLog("warning", `  ⚠️  No ISBN found for review: ${olid} (likely self-published or very old)`);
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
  addLog("success", `  ✅ ${migrated} migrated, ${skipped} skipped`);

  addLog("success", "🎉 Migration complete!");
}

export function MigrateToPopFeedCard() {
  const [logs, setLogs] = useState<MigrationLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [shouldClear, setShouldClear] = useState(false);
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [agent, setAgent] = useState<AtpAgent | null>(null);

  const addLog = (type: MigrationLog["type"], message: string) => {
    setLogs((prev) => [...prev, { type, message }]);
  };

  const authenticate = async () => {
    try {
      addLog("info", "🔐 Authenticating...");
      const newAgent = new AtpAgent({ service: "https://bsky.social" });
      await newAgent.login({
        identifier: handle.includes(".") ? handle : `${handle}.bsky.social`,
        password,
      });
      setAgent(newAgent);
      setIsAuthenticated(true);
      addLog("success", `✅ Authenticated`);
      setPassword(""); // Clear password from memory
    } catch (error) {
      addLog("error", `❌ Authentication failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const runMigration = async () => {
    if (!agent) {
      addLog("error", "❌ Not authenticated");
      return;
    }

    setIsRunning(true);

    try {
      await runMigrationLogic(agent, shouldClear, addLog);
    } catch (error) {
      addLog("error", `❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRunning(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const logout = () => {
    setAgent(null);
    setIsAuthenticated(false);
    setHandle("");
    setPassword("");
    addLog("info", "Logged out");
  };

  return (
    <Card className="w-full" sectionClassName="flex flex-col gap-4">
      {!isAuthenticated ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Migrate to Popfeed</h2>
          <p className="text-sm text-gray-400">
            <a href="https://bsky.app/profile/watwa.re/post/3m6ruq5no5c25" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
              I have stopped working on skylights.
            </a> You are of course free to continue using it via this page until the API expires or the DB outruns my nimble subscription plan. You can also host it yourself (see source). Alternatively, join me
            and migrate your Skylights data (lists, ratings, and reviews) to{" "}
            <a
              href="https://popfeed.social"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline"
            >
              Popfeed
            </a>
            . The migration runs entirely in your browser, so there are no timeout limits.
          </p>
          <p className="text-sm text-gray-400">
            {"You'll need an "}
            <a
              href="https://bsky.app/settings/app-passwords"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline"
            >
              app password
            </a>
            {" "}to run the migration. Your credentials are used only in your browser and never sent to our servers.
          </p>
          <div className="flex flex-col gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-400">Handle</span>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="user.bsky.social"
                className="border rounded-lg border-gray-400 px-3 py-2 bg-black focus:border-white outline-none"
                onKeyDown={(e) => e.key === "Enter" && authenticate()}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-400">App Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="xxxx-xxxx-xxxx-xxxx"
                className="border rounded-lg border-gray-400 px-3 py-2 bg-black focus:border-white outline-none"
                onKeyDown={(e) => e.key === "Enter" && authenticate()}
              />
            </label>
            <button
              type="button"
              onClick={authenticate}
              className="border rounded-lg border-gray-400 px-4 py-2 hover:border-white transition-all"
            >
              Sign In
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Ready to Migrate</h2>
              <p className="text-sm text-gray-400">Signed in</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="text-sm text-gray-400 hover:text-white transition-all"
            >
              Sign Out
            </button>
          </div>

          <label className="flex flex-row items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={shouldClear}
              onChange={(e) => setShouldClear(e.target.checked)}
              disabled={isRunning}
              className="w-4 h-4"
            />
            <span>Clear existing Popfeed data first (DANGER: deletes all your pre-existing popfeed data, if there is any)</span>
          </label>

          <div className="flex flex-row gap-2">
            <button
              type="button"
              onClick={runMigration}
              disabled={isRunning}
              className={cx(
                "border rounded-lg border-gray-400 px-4 py-2 transition-all",
                "hover:border-white disabled:opacity-50 disabled:cursor-not-allowed",
                isRunning && "animate-pulse",
              )}
            >
              {isRunning ? "Migrating..." : "Start Migration"}
            </button>

            {logs.length > 0 && (
              <button
                type="button"
                onClick={clearLogs}
                disabled={isRunning}
                className="border rounded-lg border-gray-400 px-4 py-2 hover:border-white transition-all disabled:opacity-50"
              >
                Clear Logs
              </button>
            )}
          </div>
        </div>
      )}

      {logs.length > 0 && (
        <div className="border border-gray-600 rounded-lg p-3 max-h-96 overflow-y-auto font-mono text-sm">
          {logs.map((log, i) => (
            <div
              key={i}
              className={cx(
                "py-0.5",
                log.type === "error" && "text-red-400",
                log.type === "success" && "text-green-400",
                log.type === "warning" && "text-yellow-400",
                log.type === "info" && "text-gray-300",
              )}
            >
              {log.message}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
