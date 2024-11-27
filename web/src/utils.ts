import { Agent } from "@atproto/api";

export const getBskyAgent = () => new Agent("https://bsky.social/xrpc");

export const now = () => new Date().toISOString();
