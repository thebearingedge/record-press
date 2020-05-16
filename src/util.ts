type Field =
  | boolean
  | null
  | number
  | string
  | Field[]
  | { toJSON: () => string }
  | { [key: string]: Field }

export type Row = Record<string, Field>

export type RowSet = {
  rows: Row[]
  type: string
}

export type Many<T> = T | T[]

export type Option<T> = T | undefined

export const toArray = <T>(value: Many<T>): T[] => {
  return Array.isArray(value) ? value : [value]
}
