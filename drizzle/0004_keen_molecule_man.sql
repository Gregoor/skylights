DROP INDEX "rels_reviewedAt_index";--> statement-breakpoint
CREATE INDEX "rels_rating_idx" ON "rels" USING btree ((value->'rating'->>'value'));--> statement-breakpoint
CREATE INDEX "rels_reviewedAt_idx" ON "rels" USING btree ("reviewedAt");--> statement-breakpoint
CREATE INDEX "rels_item_value_idx" ON "rels" USING btree ((value->'item'->>'value'));--> statement-breakpoint
CREATE INDEX "rels_item_ref_idx" ON "rels" USING btree ((value->'item'->>'ref'));