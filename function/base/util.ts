import { v4 as uuidv4 } from 'uuid'

export function autoId() {
  return uuidv4().replace(/-/g, '').toLowerCase()
}

export function defaultIfNull<T = string | null>(value: T, defaultValue: T): T {
  return value ?? defaultValue
}

export function defaultIfNullOrEmpty<T = string>(value: T, defaultValue: T): T {
  return value && value != '' ? value : defaultValue
}
