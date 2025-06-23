import { JetstreamSubscription } from "@atcute/jetstream";
import { db } from "@sl/shared/db";
import { jetskiTimeT } from "@sl/shared/db/schema";
import { deleteRecordRow, importRepo, upsertRecordRow } from "@sl/shared/utils";

async function bumpJetskiTime() {
  const time = new Date();
  await db.transaction(async (tx) => {
    await tx.delete(jetskiTimeT);
    await tx.insert(jetskiTimeT).values({ time });
  });
  return time;
}

async function sync() {
  const subscription = new JetstreamSubscription({
    url: "wss://jetstream2.us-west.bsky.network",
    wantedCollections: ["my.skylights.*"],
  });
  console.log("Listening to Jetstream...");

  const time = await bumpJetskiTime();
  setInterval(bumpJetskiTime, 1000 * 60 * 30);

  for await (const event of subscription) {
    if (event.kind === "commit") {
      const { did, commit } = event;

      if (!commit.collection.startsWith("my.skylights")) {
        continue;
      }

      await importRepo(did, time);

      const { collection, rkey: key } = commit;
      switch (commit.operation) {
        case "create":
        case "update":
          await upsertRecordRow({ did, collection, key, value: commit.record });
          break;
        case "delete":
          await deleteRecordRow({ did, collection, key });
          break;
      }
    }
  }
}

sync().catch(console.error);
