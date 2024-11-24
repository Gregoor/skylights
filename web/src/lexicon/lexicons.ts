/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { LexiconDoc, Lexicons } from '@atproto/lexicon'

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
              type: 'union',
              refs: [
                'lex:my.skylights.rel#refItem',
                'lex:my.skylights.rel#urlItem',
              ],
              closed: true,
            },
            rating: {
              type: 'integer',
              minimum: 0,
              maximum: 10,
            },
            comment: {
              type: 'string',
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
      refItem: {
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
      urlItem: {
        type: 'object',
        properties: {
          value: {
            type: 'string',
          },
        },
        required: ['value'],
      },
    },
  },
} as const satisfies Record<string, LexiconDoc>

export const schemas = Object.values(schemaDict)
export const lexicons: Lexicons = new Lexicons(schemas)
export const ids = { MySkylightsRel: 'my.skylights.rel' }
