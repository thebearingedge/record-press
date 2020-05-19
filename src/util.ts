type Field =
  | boolean
  | null
  | number
  | string
  | Field[]
  | { toJSON: () => string }
  | { [key: string]: Field }

export type Row = Record<string, Field>

export type Many<T> = T | T[]
