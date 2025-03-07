/**
 * GENERATED CODE - DO NOT MODIFY
 */
import {
  LexiconDoc,
  Lexicons,
  ValidationError,
  ValidationResult,
} from '@atproto/lexicon'
import { $Typed, is$typed, maybe$typed } from './util.js'

export const schemaDict = {
  MySkylightsRel: {
    lexicon: 1,
    id: 'my.skylights.rel',
    defs: {
      main: {
        type: 'record',
        key: 'tid',
        record: {
          type: 'object',
          properties: {
            item: {
              type: 'ref',
              ref: 'lex:my.skylights.rel#item',
            },
            rating: {
              type: 'ref',
              ref: 'lex:my.skylights.rel#rating',
            },
            note: {
              type: 'ref',
              ref: 'lex:my.skylights.rel#note',
            },
            finishedAt: {
              type: 'array',
              items: {
                type: 'string',
                format: 'datetime',
              },
            },
          },
          required: ['item'],
        },
      },
      item: {
        type: 'object',
        properties: {
          ref: {
            type: 'string',
          },
          value: {
            type: 'string',
          },
        },
        required: ['ref', 'value'],
      },
      rating: {
        type: 'object',
        properties: {
          value: {
            type: 'integer',
            minimum: 1,
            maximum: 10,
          },
          createdAt: {
            type: 'string',
            format: 'datetime',
          },
        },
        required: ['value', 'createdAt'],
      },
      note: {
        type: 'object',
        properties: {
          value: {
            type: 'string',
          },
          createdAt: {
            type: 'string',
            format: 'datetime',
          },
          updatedAt: {
            type: 'string',
            format: 'datetime',
          },
        },
        required: ['value', 'createdAt', 'updatedAt'],
      },
    },
  },
} as const satisfies Record<string, LexiconDoc>

export const schemas = Object.values(schemaDict) satisfies LexiconDoc[]
export const lexicons: Lexicons = new Lexicons(schemas)

export function validate<T extends { $type: string }>(
  v: unknown,
  id: string,
  hash: string,
  requiredType: true,
): ValidationResult<T>
export function validate<T extends { $type?: string }>(
  v: unknown,
  id: string,
  hash: string,
  requiredType?: false,
): ValidationResult<T>
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
          `Must be an object with "${hash === 'main' ? id : `${id}#${hash}`}" $type property`,
        ),
      }
}

export const ids = {
  MySkylightsRel: 'my.skylights.rel',
} as const
