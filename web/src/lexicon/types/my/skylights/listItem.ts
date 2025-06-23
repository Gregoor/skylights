/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { BlobRef, type ValidationResult } from "@atproto/lexicon";
import { CID } from "multiformats/cid";

import { validate as _validate } from "../../../lexicons";
import {
  is$typed as _is$typed,
  type $Typed,
  type OmitKey,
} from "../../../util";
import type * as MySkylightsDefs from "./defs.js";
import type * as MySkylightsList from "./list.js";

const is$typed = _is$typed,
  validate = _validate;
const id = "my.skylights.listItem";

export interface Main {
  $type?: "my.skylights.listItem";
  item?: MySkylightsDefs.Item;
  list: $Typed<MySkylightsList.Main> | $Typed<Builtin> | { $type: string };
  addedAt: string;
  position: string;
  note?: string;
}

const hashMain = "main";

export function isMain<V>(v: V) {
  return is$typed(v, id, hashMain);
}

export function validateMain<V>(v: V) {
  return validate<Main & V>(v, id, hashMain);
}

export interface Builtin {
  $type?: "my.skylights.listItem#builtin";
  type?:
    | $Typed<typeof INPROGRESS>
    | $Typed<typeof QUEUE>
    | $Typed<typeof ABANDONED>
    | $Typed<typeof OWNED>
    | $Typed<typeof WISHLIST>
    | { $type: string };
}

const hashBuiltin = "builtin";

export function isBuiltin<V>(v: V) {
  return is$typed(v, id, hashBuiltin);
}

export function validateBuiltin<V>(v: V) {
  return validate<Builtin & V>(v, id, hashBuiltin);
}

/** User is currently reading/watching/... the item */
export const INPROGRESS = `${id}#inProgress`;
/** User plans to read/watch/... the item */
export const QUEUE = `${id}#queue`;
/** User gave up on finishing the item */
export const ABANDONED = `${id}#abandoned`;
/** User owns the item */
export const OWNED = `${id}#owned`;
/** User wants to own the item */
export const WISHLIST = `${id}#wishlist`;
