# 📀 record-press

A machine for manufacturing JavaScript records.

## What is it?

`record-press` is a small utility library for generating JavaScript records. It aims to help generate test data for things like API integration tests. Other, more powerful projects exist like those that mimic [`factory_bot`](https://github.com/thoughtbot/factory_bot). `record-press` is more simplistic in its approach to avoiding ["mystery guests"](https://thoughtbot.com/blog/mystery-guest).

`record-press` is written in Typescript mostly for autocomplete convenience.

All records are dumb data: no classes or behavior. Primarily intended for seeding relational databases, nesting of associated entities is not supported. Output from `record-press` is easy to write to the database. Your access patterns are up to your app.

## Overview

1. You define a "schema" of the types of database records your app manages.

1. You build up your record collections, (optionally) assigning arbitrary property values to them as well as any necessary foreign key values.

1. `record-press` attempts to create unique records according to  constraints you specify in your schema.

1. You dump the generated records and upload them into your database.

**Note:** `record-press` does not directly depend on any particular data generation library. `faker` is only used in the below examples.

**Note:** `record-press` does not directly depend on any particular database technology.

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

### `recordPress(schema) -> records`

This package exports a single function. Calling it with a "schema" returns a record factory.

A "schema" is an object where each key is the name of an entity, paired with a **required factory function** and **optional unique constraints**. Again, `faker` is only here as an example.

```js
const records = recordPress({
  users: {
    factory: () => ({
      userId: faker.random.uuid(),
      email: faker.internet.email()
    }),
    uniqueBy: [
      'userId',
      'email'
    ]
  },
  pets: {
    factory: () => ({
      petId: faker.random.uuid(),
      breed: faker.lorem.word(),
      age: faker.random.number()
    }),
    uniqueBy: [
      'petId'
    ]
  },
  petOwners: {
    factory: () => ({
      petId: faker.random.uuid(),
      userId: faker.random.uuid()
    }),
    uniqueBy: [
      ['petId', 'userId']
    ]
  }
})
```

#### `entity.factory Function` (required)

The `factory` property of your `entity` objects should be a function returns a plain JavaScript object. You can use whatever random data library you want. All properties of the object are assumed to be serializable with `JSON.stringify()`. By default, no uniqueness is guaranteed.

#### `entity.uniqueBy Array` (optional)

The `uniqueBy` property of your `entity` objects should be an array of "constraints". Each constraint can be represented in one of three ways:

- A single property key of each record.<br/>
  No two records may have the same value for this property.
- A composite of properties on each record.<br/>
  No two records may have the same composite value for these properties.
- A function that computes a string, given a record.<br/>
  No two records may cause this function to produce the same string.

Records that are output by the entity's `factory` will be rejected if they violate any of these "constraints".


### `records.press(builderFn(factories)) -> this`

To begin (or resume) building records, pass a "builder" function to `records.press()`. Your "builder" will receive a set of factories as described in your schema. Each record built is stored within your `records` instance so that data is de-duplicated according to any provided unique constraints.

Arbitrary values can be assigned to a generated record in the form of a partial (or complete) representation of said record. That way you can have some control over the data being generated, right when you need it. The most common use case for me is adding foreign keys.

```js
records.press(build => {
  const [cat] = build.pets([ // build a cat and a dog
    { breed: 'cat' },
    { breed: 'dog' }
  ])
  const [user] = build.users() // build one person
  build.petOwners({ // assign the cat to the person
    petId: cat.petId,
    userId: user.userId
  })
})
```

### `records.dump() -> recordSets`

Get all generated records in batches, in order of creation. Each batch of records has a `type` naming the entity and the rows that were created. `records` is also reset to an empty state. Given the above example `records.dump()` would output something like:

```js
[
  {
    type: 'pets',
    rows: [
      {
        petId: '1603d7fa-0750-4dd8-acf4-66c7195d6ae6',
        breed: 'cat',
        age: 35026
      },
      {
        petId: '36b26778-cbfe-4da3-a79c-f84531274089',
        breed: 'dog',
        age: 88337
      }
    ]
  },
  {
    type: 'users',
    rows: [
      {
        userId: '65a3886e-8e4c-4e07-8231-1ed2feb7c273',
        email: 'Kyla0@gmail.com',
        username: 'Bulah_Harvey',
        firstName: 'Carli',
        lastName: 'Reichert'
      }
    ]
  },
  {
    type: 'petOwners',
    rows: [
      {
        petId: '1603d7fa-0750-4dd8-acf4-66c7195d6ae6',
        userId: '65a3886e-8e4c-4e07-8231-1ed2feb7c273'
      }
    ]
  }
]
```

The dump can then be easily inserted into a database.

## Examples

Please see the tests in `index.test.ts` for usage examples.
