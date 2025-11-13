import { format, formatDistanceToNow } from "date-fns"

type DateInput = string | number | Date | null | undefined

const DEFAULT_FORMAT = "MMM d, yyyy h:mm a"

function toDate(value: DateInput): Date | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatRelativeTime(value: DateInput): string {
  const date = toDate(value)
  if (!date) return ""
  return formatDistanceToNow(date, { addSuffix: true })
}

export function formatAbsoluteTime(value: DateInput, pattern: string = DEFAULT_FORMAT): string {
  const date = toDate(value)
  if (!date) return ""
  return format(date, pattern)
}


