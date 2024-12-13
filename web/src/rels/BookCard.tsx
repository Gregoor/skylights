import { RelCard, Title } from "./RelCard";

export type Book = {
  title: string;
  edition_key: string;
  work_key: string;
  authors: string[];
  isbn_13: string[];
  isbn_10: string[];
};

export const BOOK_KEY = "open-library";

export function BookCard({
  book,
  ...props
}: {
  book: Book;
} & Omit<
  React.ComponentProps<typeof RelCard>,
  "imgSrc" | "item" | "children"
>) {
  const editionKey = book.edition_key;
  const isbns = [...book.isbn_13, ...book.isbn_10];
  return (
    <RelCard
      imgSrc={`https://covers.openlibrary.org/b/olid/${book.edition_key}-L.jpg`}
      item={{ ref: BOOK_KEY, value: editionKey }}
      {...props}
    >
      <div>
        <Title>{book.title}</Title>
        <div className="flex flex-row gap-2">
          <div className="text-gray-400">{book.authors?.join(", ")}</div>
          {isbns.length > 0 && (
            <details className="ml-auto text-sm text-gray-500">
              <summary className="list-none underline text-end cursor-pointer">
                ISBN
              </summary>
              <p className="whitespace-pre">{isbns.join("\n")}</p>
            </details>
          )}
        </div>
      </div>
    </RelCard>
  );
}
