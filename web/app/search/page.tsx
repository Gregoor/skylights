import { redirect } from "next/navigation";

import { getSessionAgent } from "@/auth";
import { RelsProvider } from "@/rels/ctx";
import { importRepo } from "@/rels/utils";

import { ClientSearchPage } from "./client";

export default async function SearchPage() {
  const sessionAgent = await getSessionAgent(false);
  if (!sessionAgent) redirect("/");
  importRepo(sessionAgent.assertDid);
  return (
    <RelsProvider>
      <ClientSearchPage />
    </RelsProvider>
  );
}
