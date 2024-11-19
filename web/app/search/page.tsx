import { ImgWithDummy, SearchInput } from "./client";

async function Results({ query }: { query: string }) {
  if (!query) return null;

  const { hits } = (await fetch(
    `https://${process.env.QUICKWIT_HOST}/api/v1/open-library/search?query=${query}*`, //&sort_by=rating
  ).then((r) => r.json())) as {
    hits: { edition_key: string; title: string; authors?: string[] }[];
  };

  return (
    <ul className="flex flex-col gap-2">
      {hits.map((hit) => (
        <li
          key={hit.edition_key}
          className="p-2 flex flex-row gap-4 bg-gray-100"
        >
          <div className="flex-shrink-0 w-32 h-48 ">
            <ImgWithDummy
              className="object-contain"
              alt={hit.title}
              src={`https://covers.openlibrary.org/b/olid/${hit.edition_key.split("/").at(2)}-M.jpg`}
            />
          </div>
          <div>
            {hit.title}
            <div className="text-gray-400">{hit.authors?.join(", ")}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ query: string }>;
}) {
  const { query } = await searchParams;
  return (
    <div className="max-w-2xl mx-auto p-4 flex flex-col gap-4">
      <SearchInput defaultValue={query} />
      <Results query={query} />
    </div>
  );
}
