/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { ValidationResult, BlobRef } from '@atproto/lexicon'
import { CID } from 'multiformats/cid'
import { validate as _validate } from '../../../lexicons'
import { $Typed, is$typed as _is$typed, OmitKey } from '../../../util'

const is$typed = _is$typed,
  validate = _validate
const id = 'my.skylights.rel'

export interface Record {
  $type: 'my.skylights.rel'
  item: Item
  rating?: Rating
  note?: Note
  finishedAt?: string[]
  [k: string]: unknown
}

const hashRecord = 'main'

export function isRecord<V>(v: V) {
  return is$typed(v, id, hashRecord)
}

export function validateRecord<V>(v: V) {
  return validate<Record & V>(v, id, hashRecord, true)
}

export interface Item {
  $type?: 'my.skylights.rel#item'
  ref: string
  value: string
}

const hashItem = 'item'

export function isItem<V>(v: V) {
  return is$typed(v, id, hashItem)
}

export function validateItem<V>(v: V) {
  return validate<Item & V>(v, id, hashItem)
}

export interface Rating {
  $type?: 'my.skylights.rel#rating'
  value: number
  createdAt: string
}

const hashRating = 'rating'

export function isRating<V>(v: V) {
  return is$typed(v, id, hashRating)
}

export function validateRating<V>(v: V) {
  return validate<Rating & V>(v, id, hashRating)
}

export interface Note {
  $type?: 'my.skylights.rel#note'
  value: string
  createdAt: string
  updatedAt: string
}

const hashNote = 'note'

export function isNote<V>(v: V) {
  return is$typed(v, id, hashNote)
}

export function validateNote<V>(v: V) {
  return validate<Note & V>(v, id, hashNote)
}
