import { Agent } from "@atproto/api";

export const getPublicAgent = () =>
  new Agent("https://public.api.bsky.app/xrpc");

export const now = () => new Date().toISOString();
