/**
 * GENERATED CODE - DO NOT MODIFY
 */
import {
  Lexicons,
  ValidationError,
  type LexiconDoc,
  type ValidationResult,
} from "@atproto/lexicon";

import { is$typed, maybe$typed, type $Typed } from "./util";

export const schemaDict = {
  MySkylightsDefs: {
    lexicon: 1,
    id: "my.skylights.defs",
    defs: {
      item: {
        type: "object",
        properties: {
          ref: {
            type: "string",
            knownValues: ["open-library", "tmdb:m", "tmdb:s"],
          },
          value: {
            type: "string",
          },
        },
        required: ["ref", "value"],
      },
    },
  },
  MySkylightsList: {
    lexicon: 1,
    id: "my.skylights.list",
    defs: {
      main: {
        type: "object",
        properties: {
          title: {
            type: "string",
          },
          createdAt: {
            type: "string",
            format: "datetime",
          },
          description: {
            type: "string",
          },
          sortBy: {
            type: "string",
            knownValues: ["position", "date"],
          },
        },
        required: ["title"],
      },
    },
  },
  MySkylightsListItem: {
    lexicon: 1,
    id: "my.skylights.listItem",
    defs: {
      main: {
        type: "object",
        properties: {
          item: {
            type: "ref",
            ref: "lex:my.skylights.defs#item",
          },
          list: {
            type: "union",
            refs: [
              "lex:my.skylights.list",
              "lex:my.skylights.listItem#builtin",
            ],
          },
          addedAt: {
            type: "string",
            format: "datetime",
          },
          position: {
            type: "string",
          },
          note: {
            type: "string",
          },
        },
        required: ["list", "addedAt", "position"],
      },
      builtin: {
        type: "object",
        properties: {
          type: {
            type: "union",
            refs: [
              "lex:my.skylights.listItem#inProgress",
              "lex:my.skylights.listItem#todo",
              "lex:my.skylights.listItem#abandoned",
              "lex:my.skylights.listItem#owned",
              "lex:my.skylights.listItem#wanted",
            ],
          },
        },
      },
      inProgress: {
        type: "token",
        description: "User is currently reading/watching/... the item",
      },
      todo: {
        type: "token",
        description: "User plans to read/watch/... the item",
      },
      abandoned: {
        type: "token",
        description: "User gave up on finishing the item",
      },
      owned: {
        type: "token",
        description: "User owns the item",
      },
      wanted: {
        type: "token",
        description: "User wants to own the item",
      },
    },
  },
  MySkylightsRel: {
    lexicon: 1,
    id: "my.skylights.rel",
    defs: {
      main: {
        type: "record",
        key: "tid",
        record: {
          type: "object",
          properties: {
            item: {
              type: "ref",
              ref: "lex:my.skylights.defs#item",
            },
            rating: {
              type: "ref",
              ref: "lex:my.skylights.rel#rating",
            },
            note: {
              type: "ref",
              ref: "lex:my.skylights.rel#note",
            },
            finishedAt: {
              type: "array",
              items: {
                type: "string",
                format: "datetime",
              },
            },
          },
          required: ["item"],
        },
      },
      rating: {
        type: "object",
        properties: {
          value: {
            type: "integer",
            minimum: 1,
            maximum: 10,
          },
          createdAt: {
            type: "string",
            format: "datetime",
          },
        },
        required: ["value", "createdAt"],
      },
      note: {
        type: "object",
        properties: {
          value: {
            type: "string",
          },
          createdAt: {
            type: "string",
            format: "datetime",
          },
          updatedAt: {
            type: "string",
            format: "datetime",
          },
        },
        required: ["value", "createdAt", "updatedAt"],
      },
    },
  },
} as const satisfies Record<string, LexiconDoc>;
export const schemas = Object.values(schemaDict) satisfies LexiconDoc[];
export const lexicons: Lexicons = new Lexicons(schemas);

export function validate<T extends { $type: string }>(
  v: unknown,
  id: string,
  hash: string,
  requiredType: true,
): ValidationResult<T>;
export function validate<T extends { $type?: string }>(
  v: unknown,
  id: string,
  hash: string,
  requiredType?: false,
): ValidationResult<T>;
export function validate(
  v: unknown,
  id: string,
  hash: string,
  requiredType?: boolean,
): ValidationResult {
  return (requiredType ? is$typed : maybe$typed)(v, id, hash)
    ? lexicons.validate(`${id}#${hash}`, v)
    : {
        success: false,
        error: new ValidationError(
          `Must be an object with "${hash === "main" ? id : `${id}#${hash}`}" $type property`,
        ),
      };
}

export const ids = {
  MySkylightsDefs: "my.skylights.defs",
  MySkylightsList: "my.skylights.list",
  MySkylightsListItem: "my.skylights.listItem",
  MySkylightsRel: "my.skylights.rel",
} as const;
