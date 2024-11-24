/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { ValidationResult, BlobRef } from '@atproto/lexicon'
import { lexicons } from '../../../lexicons'
import { isObj, hasProp } from '../../../util'
import { CID } from 'multiformats/cid'

export interface Record {
  item: RefItem | UrlItem
  rating?: number
  comment?: string
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
