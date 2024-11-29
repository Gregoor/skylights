import cx from "classix";
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.log("authorize errror ✨", error, (error as any).payload);
    throw error;
  }
}

export default async function LandingPage() {
  const agent = await getSessionAgent(false);
  if (agent) {
    redirect(agent.did ? "/profile/" + agent.did : "/search");
  }
  return (
    <Card
      className="mx-auto w-full max-w-sm"
      sectionClassName="flex flex-col gap-2"
    >
      <h1 className="text-lg">Sign-in with Bluesky</h1>
      <form className="flex flex-row gap-2" action={login}>
        <label
          className={cx(
            "group border rounded-lg border-gray-400 focus-within:border-white",
            "transition-all w-full flex flex-row bg-black",
          )}
        >
          <div
            className={cx(
              "border-r border-gray-400 px-2 flex items-center text-gray-400",
              "group-focus-within:border-white group-focus-within:text-white",
              "transition-all text-sm",
            )}
          >
            @
          </div>
          <input
            type="text"
            name="handle"
            placeholder="Handle"
            autoCorrect="off"
            autoComplete="off"
            className={cx("outline-none", "p-2 w-full bg-transparent")}
          />
        </label>
        <SubmitButton />
      </form>
    </Card>
  );
}
