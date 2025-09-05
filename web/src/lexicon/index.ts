/**
 * GENERATED CODE - DO NOT MODIFY
 */
import {
  createServer as createXrpcServer,
  Server as XrpcServer,
  type AuthVerifier,
  type StreamAuthVerifier,
  type Options as XrpcOptions,
} from "@atproto/xrpc-server";

import { schemas } from "./lexicons.js";

export const MY_SKYLIGHTS = {
  ListItemInProgress: "my.skylights.listItem#inProgress",
  ListItemQueue: "my.skylights.listItem#queue",
  ListItemAbandoned: "my.skylights.listItem#abandoned",
  ListItemOwned: "my.skylights.listItem#owned",
  ListItemWishlist: "my.skylights.listItem#wishlist",
};

export function createServer(options?: XrpcOptions): Server {
  return new Server(options);
}

export class Server {
  xrpc: XrpcServer;
  my: MyNS;

  constructor(options?: XrpcOptions) {
    this.xrpc = createXrpcServer(schemas, options);
    this.my = new MyNS(this);
  }
}

export class MyNS {
  _server: Server;
  skylights: MySkylightsNS;

  constructor(server: Server) {
    this._server = server;
    this.skylights = new MySkylightsNS(server);
  }
}

export class MySkylightsNS {
  _server: Server;

  constructor(server: Server) {
    this._server = server;
  }
}

type SharedRateLimitOpts<T> = {
  name: string;
  calcKey?: (ctx: T) => string | null;
  calcPoints?: (ctx: T) => number;
};
type RouteRateLimitOpts<T> = {
  durationMs: number;
  points: number;
  calcKey?: (ctx: T) => string | null;
  calcPoints?: (ctx: T) => number;
};
type HandlerOpts = { blobLimit?: number };
type HandlerRateLimitOpts<T> = SharedRateLimitOpts<T> | RouteRateLimitOpts<T>;
type ConfigOf<Auth, Handler, ReqCtx> =
  | Handler
  | {
      auth?: Auth;
      opts?: HandlerOpts;
      rateLimit?: HandlerRateLimitOpts<ReqCtx> | HandlerRateLimitOpts<ReqCtx>[];
      handler: Handler;
    };
