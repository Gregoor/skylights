import { BaseCard, Title } from "./BaseCard";

export type Book = {
  key: string;
  title: string;
  author_name: string[];
  isbn?: string[];
  editions: { docs: { key: string; title: string }[] };
};

export const BOOK_KEY = "open-library";

export function BookCard({
  book,
  children,
  ...props
}: {
  book: Book;
} & Omit<React.ComponentProps<typeof BaseCard>, "imgSrc" | "item" | "type">) {
  const [edition] = book.editions.docs;
  const editionKey = edition.key.split("/").at(2);
  if (!editionKey) return null;
  return (
    <BaseCard
      imgSrc={`https://covers.openlibrary.org/b/olid/${editionKey}-L.jpg`}
      item={{ ref: BOOK_KEY, value: editionKey! }}
      type="book"
      {...props}
    >
      <div>
        <Title>{edition.title ?? book.title}</Title>
        <div className="flex flex-row gap-2">
          <div className="text-gray-400">{book.author_name?.join(", ")}</div>
          {book.isbn && book.isbn.length > 0 && (
            <details className="ml-auto text-sm text-gray-500">
              <summary className="list-none underline text-end cursor-pointer">
                ISBN
              </summary>
              <p className="whitespace-pre">{book.isbn.join("\n")}</p>
            </details>
          )}
        </div>
        {children}
      </div>
    </BaseCard>
  );
}
