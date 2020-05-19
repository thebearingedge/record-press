import { Many } from './util'

type Inverter<R> = (record: R) => string

type Attribute<R> = Extract<keyof R, string>

export type UniqueBy<R> = Array<Inverter<R> | Many<Attribute<R>>>

export default class Table<R> {

  readonly name: string
  private indexes: Array<Record<string, R>>
  private readonly inverters: Array<Inverter<R>>

  constructor(name: string, uniqueBy: UniqueBy<R>) {
    this.name = name
    this.inverters = uniqueBy.map(unique => {
      if (typeof unique === 'function') return unique
      if (typeof unique === 'string') {
        return (row: R) => JSON.stringify(row[unique])
      }
      return (row: R) => JSON.stringify(unique.map(key => row[key]))
    })
    this.indexes = this.inverters.map(() => Object.create(null))
  }

  add(row: R): boolean {
    const keys = this.inverters.map(invert => invert(row))
    if (this.has(keys)) return false
    this.store(keys, row)
    return true
  }

  clear(): void {
    this.indexes = this.inverters.map(() => Object.create(null))
  }

  private has(keys: string[]): boolean {
    return this.indexes.some((stored, index) => stored[keys[index]])
  }

  private store(keys: string[], record: R): void {
    this.indexes.forEach((stored, index) => { stored[keys[index]] = record })
  }

}
