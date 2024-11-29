import { Agent } from "@atproto/api";

export const getXRPC_Agent = () => new Agent("https://bsky.social/xrpc");
export const getPublicAgent = () =>
  new Agent("https://public.api.bsky.app/xrpc");

export const now = () => new Date().toISOString();
