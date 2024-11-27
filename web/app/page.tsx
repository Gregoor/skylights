import { redirect } from "next/navigation";

import { authClient, getSessionAgent } from "@/auth";
import { Card } from "@/ui";
import { SubmitButton } from "./client";

async function login(formData: FormData) {
  "use server";
  const handle = formData.get("handle");
  if (!handle) {
    throw new Error("Handle is required");
  }
  try {
    const url = await authClient.authorize(handle.toString(), {
      ui_locales: "en",
    });
    redirect(url.toString());
  } catch (error: unknown) {
    console.log(
      "authorize errror ✨",
      error,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error as any)?.constructor?.name,
    );
    throw error;
  }
}

export default async function LandingPage() {
  const agent = await getSessionAgent(false);
  if (agent) {
    redirect("/search");
  }
  return (
    <Card className="mx-auto w-full max-w-sm flex flex-col gap-2">
      <h1 className="text-lg">Sign-in with Bluesky</h1>
      <form className="flex flex-row gap-2" action={login}>
        <input
          type="text"
          name="handle"
          placeholder="Handle"
          className={[
            "outline-none border rounded-lg border-gray-400",
            "focus:border-white transition-all p-2 w-full bg-black",
          ].join(" ")}
        />
        <SubmitButton />
      </form>
    </Card>
  );
}
