/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { ValidationResult, BlobRef } from '@atproto/lexicon'
import { lexicons } from '../../../lexicons'
import { isObj, hasProp } from '../../../util'
import { CID } from 'multiformats/cid'

export interface Record {
  item: RefItem | UrlItem
  rating?: Rating
  note?: Note
  finishedAt?: string[]
  [k: string]: unknown
}

export function isRecord(v: unknown): v is Record {
  return (
    isObj(v) &&
    hasProp(v, '$type') &&
    (v.$type === 'my.skylights.rel#main' || v.$type === 'my.skylights.rel')
  )
}

export function validateRecord(v: unknown): ValidationResult {
  return lexicons.validate('my.skylights.rel#main', v)
}

export interface RefItem {
  ref: string
  value: string
  [k: string]: unknown
}

export function isRefItem(v: unknown): v is RefItem {
  return (
    isObj(v) && hasProp(v, '$type') && v.$type === 'my.skylights.rel#refItem'
  )
}

export function validateRefItem(v: unknown): ValidationResult {
  return lexicons.validate('my.skylights.rel#refItem', v)
}

export interface UrlItem {
  value: string
  [k: string]: unknown
}

export function isUrlItem(v: unknown): v is UrlItem {
  return (
    isObj(v) && hasProp(v, '$type') && v.$type === 'my.skylights.rel#urlItem'
  )
}

export function validateUrlItem(v: unknown): ValidationResult {
  return lexicons.validate('my.skylights.rel#urlItem', v)
}

export interface Rating {
  value: number
  createdAt: string
  [k: string]: unknown
}

export function isRating(v: unknown): v is Rating {
  return (
    isObj(v) && hasProp(v, '$type') && v.$type === 'my.skylights.rel#rating'
  )
}

export function validateRating(v: unknown): ValidationResult {
  return lexicons.validate('my.skylights.rel#rating', v)
}

export interface Note {
  value: string
  createdAt: string
  updatedAt: string
  [k: string]: unknown
}

export function isNote(v: unknown): v is Note {
  return isObj(v) && hasProp(v, '$type') && v.$type === 'my.skylights.rel#note'
}

export function validateNote(v: unknown): ValidationResult {
  return lexicons.validate('my.skylights.rel#note', v)
}
