import Table from './table'
import { Row, Option } from './util'

type Factory = () => Row

type GeneratorOptions = {
  retries: number
}

type RowGen<R> = Generator<R, never, Option<Partial<R>>>

type CreateGenerator = {
  <R>(table: Table<R>, factory: Factory, options: GeneratorOptions): RowGen<R>
}

const createGenerator: CreateGenerator = (table, factory, { retries }) => {
  const generator = (function * () {
    let partial = yield
    let failures = retries
    while (true) {
      const record = Object.assign(factory(), partial)
      if (table.add(record)) {
        partial = yield record
        continue
      }
      if (--failures === 0) {
        throw new Error(
          `failed to create unique "${table.name}" row after ${retries} retries`
        )
      }
    }
  })()
  generator.next()
  return generator
}

export default createGenerator
