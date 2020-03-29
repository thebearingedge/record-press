type Data =
  boolean |
  null |
  number |
  string |
  Data[] |
  { toJSON(): string } |
  { [key: string]: Data }

type KeyGen<R> = (record: R) => string

type Property<R> = Extract<keyof R, string>

type Unique<R> = Property<R> | Array<Property<R>> | KeyGen<R>

type Config<R> = {
  factory: () => R
  uniqueBy?: Array<Unique<R>>
}

type Options<R> = {
  count?: number
  retries?: number
  override?: Partial<R>
}

class Indexer<R> {

  private readonly indexes: Array<Record<string, boolean>>

  constructor(uniqueBy: Array<Unique<R>>) {
    this.indexes = uniqueBy.map(() => Object.create(null))
  }

  has(keys: string[]): boolean {
    return this.indexes.some((keyed, index) => keyed[keys[index]])
  }

  add(keys: string[]): void {
    this.indexes.forEach((keyed, index) => { keyed[keys[index]] = true })
  }

}

export = function recordPress<R extends Record<string, Data>>(config: Config<R>) {
  const { factory, uniqueBy = [] } = config
  const keyGens = uniqueBy.map(unique => {
    if (typeof unique === 'function') return unique
    if (typeof unique === 'string') {
      return (record: R) => JSON.stringify(record[unique])
    }
    return (record: R) => JSON.stringify(unique.map(key => record[key]))
  })
  return function * generator(options?: Options<R>): Generator<R> {
    const indexer = new Indexer(uniqueBy)
    const { count = 1, retries = 5000, override } = options ?? {}
    let retry = 0
    let succeeded = 0
    while (succeeded < count) {
      const record = Object.assign(factory(), override)
      const keys = keyGens.map(keyGen => keyGen(record))
      if (!indexer.has(keys)) {
        succeeded++
        indexer.add(keys)
        yield record
        continue
      }
      if (++retry > retries) {
        throw new Error(`record press generator exceeded ${retries} retries`)
      }
    }
  }
}
