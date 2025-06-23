CREATE TABLE "list_items" (
	"did" char(32) NOT NULL,
	"key" char(13) NOT NULL,
	"value" jsonb NOT NULL,
	CONSTRAINT "list_items_did_key_pk" PRIMARY KEY("did","key")
);
--> statement-breakpoint
CREATE TABLE "lists" (
	"did" char(32) NOT NULL,
	"key" char(13) NOT NULL,
	"value" jsonb NOT NULL,
	CONSTRAINT "lists_did_key_pk" PRIMARY KEY("did","key")
);
--> statement-breakpoint
CREATE INDEX "list_items_item_value_idx" ON "list_items" USING btree ((value->'item'->>'value'));--> statement-breakpoint
CREATE INDEX "list_items_item_ref_idx" ON "list_items" USING btree ((value->'item'->>'ref'));