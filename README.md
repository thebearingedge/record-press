# 📀 record-press

A machine for manufacturing JavaScript records.

## What is it?

`record-press` is a helper library for generating JavaScript records. It aims to fill the gap between libraries like [`faker`](https://github.com/marak/Faker.js) or [`casual`](https://github.com/boo1ean/casual) and uniqueness across a collection of objects.

This library is not very ambitious. It's [less than 100 lines of Typescript](https://github.com/thebearingedge/record-press/blob/master/src/index.ts). I just got tired of re-implementing the same de-duplication strategy in each of my projects.

**Note:** `record-press` does not directly depend on any particular data generation library. `faker` is only used in the below examples.

## Installation

```bash
npm install record-press
# or, more likely
npm install --save-dev record-press
```

```ts
// ES Module
import recordPress from 'record-press'
// CommonJS Module
const recordPress = require('record-press')
```

## API

```shell
recordPress(config) -> generator(options)
```

This package exports a single function. Calling it with a basic configuration object returns a [generator function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*).

### `config Object`

#### `config.factory Function` (required)

The `factory` property of your `config` object should be a function returns a plain JavaScript object. You can use whatever random data library you want. All properties of the object are assumed to be serializable with `JSON.stringify()`. By default, no uniqueness is guaranteed.

#### `config.uniqueBy Array` (optional)

The `uniqueBy` property of your `config` object should be an array of "constraints". Each constraint can be represented in one of three ways:

- A single property of each record.<br/>
  No two records may have the same value for this property.
- A combination of properties on each record.<br/>
  No two records may have the same composite value for these properties.
- A function that computes a string, given a record.<br/>
  No two records may cause this function to produce the same string.

Records that are output by the `config.factory` will be rejected if they violate any of these "constraints".

### `generator(options)`

Once you have created a generator function, you can call it with a couple of `options`.

#### `options.count Number` (default `1`)

Specify the number of records the generator should produce.

#### `options.override Object` (optional)

Specify a partial object to copy properties from. This is useful if you want to ensure the value of any of the record's properties.

#### `options.retries Number` (default `5000`)

Collisions can occur when dealing with random data. The generator will detect them and discard records that do not conform to the rules specified in `uniqueBy`. By default, up to `5000` collisions are tolerated before an `Error` is thrown.

## Examples

### `config.factory`

```js
const generator = recordPress({
  factory: () => ({
    x: faker.random.number(),
    y: faker.random.number()
  })
})
```

### `config.uniqueBy`

```js
it('generates records with unique keys', () => {
  const generator = recordPress({
    factory: () => ({
      x: faker.random.number(24),
      y: faker.random.number(24)
    }),
    uniqueBy: [
      'x', // no two points may have the same "x"
      'y'  // no two points may have the same "y"
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
      x: faker.random.number(4),
      y: faker.random.number(4)
    }),
    uniqueBy: [
      ['x', 'y']
      // no two points may have the same coordinates
    ]
  })
  const [...points] = generator({ count: 25 })
  const coordinates = new Set(points.map(({ x, y }) => `${x}, ${y}`))
  expect(coordinates).to.have.lengthOf(25)
})

it('generates records with unique generated keys', () => {
  const generator = recordPress({
    factory: () => ({
      x: faker.random.number(4),
      y: faker.random.number(4)
    }),
    uniqueBy: [
      ({ x, y }) => `${x}, ${y}`
      // no two points may have the same coordinates
    ]
  })
  const [...points] = generator({ count: 25 })
  const coordinates = new Set(points.map(({ x, y }) => `${x}, ${y}`))
  expect(coordinates).to.have.lengthOf(25)
})
```

### `options.override`

```js
it('overrides values on each record', () => {
  const generator = recordPress({
    factory: () => ({
      x: faker.random.number(4),
      y: faker.random.number(4)
    })
  })
  for (const point of generator({ count: 5, override: { x: 0 } })) {
    expect(point).to.include({ x: 0 })
  }
})
```

### `options.retries`

```js
it('throws after too many retries', () => {
  const generator = recordPress({
    factory: () => ({
      x: 0,
      y: 0
    }),
    uniqueBy: [
      ['x', 'y']
      // impossible for more than one record
    ]
  })
  expect(() => {
    const iterator = generator({ count: 2, retries: 3 })
    iterator.next()
    iterator.next()
  }).to.throw(Error, 'record press generator exceeded 3 retries')
})
```
