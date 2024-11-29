import { redirect } from "next/navigation";
import { fromEntries } from "remeda";

import { getSessionAgent } from "@/auth";
import { RelsProvider } from "@/rels/RelsCtx";
import { listRels } from "@/rels/utils";

import { ClientSearchPage } from "./client";

export default async function SearchPage() {
  const sessionAgent = await getSessionAgent(false);
  if (!sessionAgent) redirect("/");
  const rels = await listRels(sessionAgent.assertDid);
  return (
    <RelsProvider initialRels={fromEntries(rels.map((r) => [r.uri, r.value]))}>
      <ClientSearchPage />
    </RelsProvider>
  );
}
