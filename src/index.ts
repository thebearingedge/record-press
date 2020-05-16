import createGenerator from './generator'
import Table, { UniqueBy } from './table'
import { Many, Row, RowSet, toArray } from './util'

type Seed<F extends (...args: any) => any> = Many<Partial<ReturnType<F>>>

type Rows<F extends (...args: any) => any> = Array<ReturnType<F>>

type BuildOptions = {
  retries?: number
}

type Entity = Record<string, () => Row>

type Build<E extends Entity> = {
  [K in keyof E]: {
    (seed?: Seed<E[K]>, options?: BuildOptions): Rows<E[K]>
  }
}

type Records<E extends Entity> = {
  dump: () => RowSet[]
  press: (builder: (build: Build<E>) => void) => Records<E>
}

type Schema<E extends Entity> = {
  [K in keyof E]: {
    factory: E[K]
    uniqueBy?: UniqueBy<ReturnType<E[K]>>
  }
}

const DEFAULT_MAX_RETRIES = 5000

const createRecordPress = <E extends Entity>(schema: Schema<E>): Records<E> => {

  const rowSets: RowSet[] = []
  const build: Build<E> = Object.create(null)
  const tables: Map<keyof E, Table<ReturnType<E[keyof E]>>> = new Map()

  for (const type in schema) {
    const { factory, uniqueBy = [] } = schema[type]
    const table = new Table(type, uniqueBy)
    tables.set(type, table)
    build[type] = (seed, options) => {
      const { retries = DEFAULT_MAX_RETRIES } = options ?? {}
      const generator = createGenerator(table, factory, { retries })
      const rows = toArray(seed).map(partial => generator.next(partial).value)
      rowSets.push({ type, rows })
      return rows
    }
  }

  return {
    press(builder) {
      builder(build)
      return this
    },
    dump() {
      tables.forEach(indexer => indexer.clear())
      return rowSets.splice(0, rowSets.length)
    }
  }
}

export default createRecordPress
