import createGenerator from './generator'
import Table, { UniqueBy } from './table'
import { Many, Row, toArray } from './util'

type Batch = {
  rows: Row[]
  type: string
}

type Seed<F extends (...args: any) => any> = Many<Partial<ReturnType<F>>>

type Rows<F extends (...args: any) => any> = Array<ReturnType<F>>

type BuildOptions = {
  retries?: number
}

type Entity = Record<string, () => Row>

type Build<E extends Entity> = {
  [K in keyof E]: {
    /**
     * Build record(s) of this type as described in the provided schema.
     * A set of overriding attributes can be passed so that
     * the resulting record(s) contain these values.
     * Resulting record(s) are cached in the record store
     * until all records are dumped.
     */
    (seed?: Seed<E[K]>, options?: BuildOptions): Rows<E[K]>
  }
}

type RecordStore<E extends Entity> = {
  /**
   * Flush all stored records from the record store
   * and clear all de-duplication indexes.
   * Records are returned as batches in the order they were generated.
   * Each batch is labeled with the type of record in the batch.
   */
  dump: () => Batch[]
  /**
   * Receive the record builder in a callback to build some records.
   * Any record type described by the provided schema can be generated.
   * Records are de-duplicated according to unique constraints
   * described by the schema and cached between invocations of `press()`.
   */
  press: (builder: (build: Build<E>) => void) => RecordStore<E>
}

type Schema<E extends Entity> = {
  [K in keyof E]: {
    factory: E[K]
    uniqueBy?: UniqueBy<ReturnType<E[K]>>
  }
}

const DEFAULT_MAX_RETRIES = 5000

/**
 * Creates a stateful record store based on the provided schema.
 * The returned object houses records for each type described in the schema.
 */
const recordPress = <E extends Entity>(schema: Schema<E>): RecordStore<E> => {

  const batches: Batch[] = []
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
      batches.push({ type, rows })
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
      return batches.splice(0, batches.length)
    }
  }
}

export default recordPress
