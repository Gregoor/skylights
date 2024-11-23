import { Agent } from "@atproto/api";
import { NextRequest, NextResponse } from "next/server";

import { authClient } from "@/auth";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const { session, state } = await authClient.callback(params);

  console.log("authorize() was called with state:", state);
  console.log("User authenticated as:", session.did);
  const agent = new Agent(session);

  const profile = await agent.getProfile({ actor: agent.did! });
  console.log("Bsky profile:", profile.data);

  return NextResponse.json({ ok: true });
}
