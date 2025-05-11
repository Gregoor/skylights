import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import * as v from "valibot";

import { authClient, AuthStateSchema } from "@/auth";

export async function GET({ nextUrl }: NextRequest) {
  const { state } = await authClient.callback(nextUrl.searchParams);
  redirect(
    state ? (v.parse(AuthStateSchema, JSON.parse(state)).returnTo ?? "/") : "/",
  );
}
