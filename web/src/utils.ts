import { Agent } from "@atproto/api";

export const getBskyAgent = () => new Agent("https://public.api.bsky.app");

export const now = () => new Date().toISOString();
