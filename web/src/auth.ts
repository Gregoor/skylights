import { Agent } from "@atproto/api";
import { BrowserOAuthClient } from "@atproto/oauth-client-browser";

const isDev = import.meta.env.DEV;
const origin = isDev ? new URL(import.meta.url).origin : "https://skylights.my";

const SCOPE = "atproto transition:generic";

export const authClient = new BrowserOAuthClient({
  handleResolver: "https://bsky.social",
  clientMetadata: {
    client_name: "Skylights",
    client_id: isDev ? "http://localhost" : origin,
    client_uri: origin,
    redirect_uris: [origin],
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    application_type: "web",
    scope: SCOPE,
    token_endpoint_auth_method: "none",
  },
});

async function getSession() {
  const result = await authClient.init();
  return result?.session;
}
