CREATE TABLE "ol_books" (
	"id" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL
);
--> statement-breakpoint
CREATE INDEX "list_items_list_key_idx" ON "list_items" USING btree ((value->'list'->'type'->>'type'));--> statement-breakpoint
CREATE INDEX "list_items_added_at_idx" ON "list_items" USING btree ((value->>'addedAt'));