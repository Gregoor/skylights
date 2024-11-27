import { useState } from "react";
import { authClient } from "./auth";
import { Button, Card, Input } from "./ui";

export function Login() {
  const [handle, setHandle] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <div className="max-w-sm w-full mx-auto">
      <Card className="flex flex-col gap-2">
        <h1 className="text-lg">Sign-in with Bluesky</h1>
        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setPending(true);
            authClient.signIn(handle);
          }}
        >
          <Input
            placeholder="Handle"
            value={handle}
            onChange={(event) => setHandle(event.target.value)}
          />
          <div className="ml-auto">
            <Button
              type="submit"
              disabled={pending}
              className="m-0.5 py-1 px-2"
            >
              Go{" "}
              <span
                className={pending ? "animate-pulse" : ""}
                style={{
                  WebkitTransition: "-webkit-filter 200ms linear",
                  filter: pending ? undefined : "brightness(50%) invert(70%)",
                }}
              >
                💫
              </span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
