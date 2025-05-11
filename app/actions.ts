"use server";

import { redirect } from "next/navigation";

import { authClient, AuthState } from "@/auth";

export async function login(handle: string, returnTo?: string | null) {
  let url: string | undefined;
  try {
    url = (
      await authClient.authorize(handle.toString(), {
        ui_locales: "en",
        state: JSON.stringify(
          (returnTo ? { returnTo } : {}) satisfies AuthState,
        ),
      })
    ).toString();
    console.log("redirecting to", url);
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.error("authorize errror ✨", error, (error as any).payload);
  }
  if (url) {
    redirect(url);
  }
}
