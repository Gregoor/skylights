CREATE TABLE "ol_book_editions" (
	"id" text PRIMARY KEY NOT NULL,
	"bookId" text
);
--> statement-breakpoint
ALTER TABLE "ol_book_editions" ADD CONSTRAINT "ol_book_editions_bookId_ol_books_id_fk" FOREIGN KEY ("bookId") REFERENCES "public"."ol_books"("id") ON DELETE no action ON UPDATE no action;