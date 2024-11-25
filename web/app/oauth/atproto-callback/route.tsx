import { NextRequest } from "next/server";

import { authClient } from "@/auth";
import { redirect } from "next/navigation";

export async function GET({ nextUrl }: NextRequest) {
  await authClient.callback(nextUrl.searchParams);
  redirect("/");
}
