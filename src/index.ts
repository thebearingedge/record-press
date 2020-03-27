type Data =
  boolean |
  null |
  number |
  string |
  Date |
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

  indexed: number
  private readonly keyGens: Array<KeyGen<R>>
  private readonly indexes: Array<Record<string, boolean>>

  constructor(uniqueBy: Array<Unique<R>>) {
    this.indexed = 0
    this.indexes = uniqueBy.map(() => Object.create(null))
    this.keyGens = uniqueBy.map(unique => {
      if (typeof unique === 'function') return unique
      if (typeof unique === 'string') {
        return (record: R) => JSON.stringify(record[unique])
      }
      return (record: R) => JSON.stringify(unique.map(key => record[key]))
    })
  }

  has(record: R): boolean {
    return this.keyGens.some((keyGen, index) => {
      const key = keyGen(record)
      return this.indexes[index][key]
    })
  }

  add(record: R): void {
    this.indexed++
    this.keyGens.forEach((keyGen, index) => {
      const key = keyGen(record)
      this.indexes[index][key] = true
    })
  }

}

export = function recordPress<R extends Record<string, Data>>(config: Config<R>) {
  const { factory, uniqueBy = [] } = config
  return function * generator(options?: Options<R>) {
    const indexer = new Indexer(uniqueBy)
    const { count = 1, retries = 5000, override } = options ?? {}
    let retry = 0
    while (indexer.indexed < count) {
      if (retry === retries) {
        throw new Error(`record press generator exceeded ${retries} retries`)
      }
      const record = Object.assign(factory(), override)
      if (indexer.has(record)) {
        retry++
        continue
      }
      indexer.add(record)
      yield record
    }
  }
}
