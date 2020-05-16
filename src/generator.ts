import Table from './table'
import { Row } from './util'

type Factory = () => Row

type RowGenOptions = {
  retries: number
}

type RowGen<R> = Generator<R, never, Partial<R> | undefined>

type CreateRowGen = {
  <R>(table: Table<R>, factory: Factory, options: RowGenOptions): RowGen<R>
}

const createRowGen: CreateRowGen = (table, factory, { retries }) => {
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

export default createRowGen
