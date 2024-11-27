import { useState } from "react";
import { authClient } from "./auth";
import { Button, Card } from "./ui";

export function Login() {
  const [handle, setHandle] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <div className="max-w-sm w-full mx-auto">
      <Card className="flex flex-col gap-2">
        <h1 className="text-lg">Sign-in with Bluesky</h1>
        <form
          className="flex flex-row gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setPending(true);
            authClient.signIn(handle);
          }}
        >
          <input
            type="text"
            placeholder="Handle"
            value={handle}
            onChange={(event) => setHandle(event.target.value)}
            className={[
              "outline-none border rounded-lg border-gray-400",
              "focus:border-white transition-all p-2 w-full bg-black",
            ].join(" ")}
          />
          <Button
            type="submit"
            disabled={pending}
            className={[
              "rounded-lg m-0.5 py-1 px-2",
              pending ? "animate-pulse" : "",
            ].join(" ")}
            style={{
              WebkitTransition: "-webkit-filter 200ms linear",
              filter: pending ? undefined : "brightness(50%) invert(70%)",
            }}
          >
            💫
          </Button>
        </form>
      </Card>
    </div>
  );
}
