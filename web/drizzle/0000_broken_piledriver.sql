CREATE TABLE IF NOT EXISTS "imported_dids" (
	"did" char(32) PRIMARY KEY NOT NULL,
	"importedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "jetski_time" (
	"time" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rels" (
	"did" char(32),
	"key" char(13),
	"value" jsonb NOT NULL,
	CONSTRAINT "rels_did_key_pk" PRIMARY KEY("did","key")
);
