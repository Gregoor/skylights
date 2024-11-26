import { fetchRatedBooks } from "@/books/utils";
import { ClientSearchPage } from "./client";
import { getSessionAgent } from "@/auth";

export default async function SearchPage() {
  const sessionAgent = await getSessionAgent(false);
  const ratedBooks = sessionAgent
    ? await fetchRatedBooks(sessionAgent.assertDid)
    : [];
  return (
    <ClientSearchPage
      defaultRatings={Object.fromEntries(
        ratedBooks.map((i) => [i.book.work_key, i.rating.value]),
      )}
    />
  );
}
