import { redirect } from "next/navigation";

import { authClient } from "@/auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const handle = request.nextUrl.searchParams.get("handle");
  if (!handle) {
    return { status: 400, body: "Missing handle" };
  }
  const url = await authClient.authorize(handle.toString(), {
    ui_locales: "en",
  });
  redirect(url.toString());
}
