import { Agent } from "@atproto/api";

export const getPublicAgent = () =>
  new Agent("https://public.api.bsky.app/xrpc");

export const now = () => new Date().toISOString();

export function timeSince(date: Date) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seconds = Math.floor(((new Date() as any) - (date as any)) / 1000);
  let interval = seconds / 31536000;

  if (interval > 1) {
    return date.toISOString().split("T")[0];
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + "mo";
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + "d";
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + "h";
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + "m";
  }
  return Math.floor(seconds) + "s";
}
