import 'mocha'
import chai, { expect } from 'chai'
import { chaiStruct } from 'chai-struct'
import recordPress from '.'

chai.use(chaiStruct)

function randomInteger(max: number): number {
  return Math.floor(Math.random() * (max + 1))
}

it('generates a single record', () => {
  const generator = recordPress({
    factory: () => ({
      x: randomInteger(4),
      y: randomInteger(4)
    })
  })
  const [...onePoint] = generator()
  expect(onePoint)
    .to.have.lengthOf(1)
    .and.structure([{ x: Number, y: Number }])
})

it('generates multiple records', () => {
  const generator = recordPress({
    factory: () => ({
      x: randomInteger(4),
      y: randomInteger(4)
    })
  })
  const [...fivePoints] = generator({ count: 5 })
  expect(fivePoints)
    .to.have.lengthOf(5)
    .and.structure([{ x: Number, y: Number }])
})

it('overrides values on each record', () => {
  const generator = recordPress({
    factory: () => ({
      x: randomInteger(4),
      y: randomInteger(4)
    })
  })
  for (const point of generator({ count: 5, override: { x: 0 } })) {
    expect(point).to.include({ x: 0 })
  }
})

it('generates records with unique keys', () => {
  const generator = recordPress({
    factory: () => ({
      x: randomInteger(24),
      y: randomInteger(24)
    }),
    uniqueBy: [
      'x',
      'y'
    ]
  })
  const [...points] = generator({ count: 25 })
  const xs = new Set(points.map(({ x }) => x))
  const ys = new Set(points.map(({ y }) => y))
  expect(xs).to.have.lengthOf(25)
  expect(ys).to.have.lengthOf(25)
})

it('generates records with unique composite keys', () => {
  const generator = recordPress({
    factory: () => ({
      x: randomInteger(4),
      y: randomInteger(4)
    }),
    uniqueBy: [
      ['x', 'y']
    ]
  })
  const [...points] = generator({ count: 25 })
  const coordinates = new Set(points.map(({ x, y }) => `${x}|${y}`))
  expect(coordinates).to.have.lengthOf(25)
})

it('generates records with unique computed keys', () => {
  const generator = recordPress({
    factory: () => ({
      x: randomInteger(4),
      y: randomInteger(4)
    }),
    uniqueBy: [
      ({ x, y }) => `${x}|${y}`
    ]
  })
  const [...points] = generator({ count: 25 })
  const coordinates = new Set(points.map(({ x, y }) => `${x}|${y}`))
  expect(coordinates).to.have.lengthOf(25)
})

it('throws after too many retries', () => {
  const generator = recordPress({
    factory: () => ({
      x: 0,
      y: 0
    }),
    uniqueBy: [
      ['x', 'y']
    ]
  })
  expect(() => {
    const iterator = generator({ count: 2, retries: 3 })
    iterator.next()
    iterator.next()
  }).to.throw(Error, 'record press generator exceeded 3 retries')
})
