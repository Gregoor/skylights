import Link from "next/link";

import { getSessionAgent } from "@/auth";
import { fetchRatedBooks } from "@/books/utils";

import { deleteAll } from "./actions";
import { RatedBooks } from "./RatedBooks";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const [ratedBooks, hasSession] = await Promise.all([
    fetchRatedBooks(handle),
    getSessionAgent(false),
  ]);
  return (
    <div className="flex flex-col gap-4">
      {hasSession ? (
        <Link
          className="w-full text-center underline hover:opacity-80"
          href="/search"
        >
          Go to Search
        </Link>
      ) : (
        <Link
          className="w-full text-center underline hover:opacity-80"
          href="/"
        >
          Login
        </Link>
      )}
      {process.env.NODE_ENV != "production" && (
        <form action={deleteAll}>
          <button type="submit">Clear</button>
        </form>
      )}
      <RatedBooks ratedBooks={ratedBooks} />
    </div>
  );
}
