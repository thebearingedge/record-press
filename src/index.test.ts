import 'mocha'
import faker from 'faker'
import { expect } from 'chai'
import recordPress from '.'

const records = recordPress({
  pets: {
    factory: () => ({
      petId: faker.random.uuid(),
      breed: faker.lorem.word(),
      age: faker.random.number()
    })
  },
  petOwners: {
    factory: () => ({
      petId: faker.random.uuid(),
      userId: faker.random.uuid()
    }),
    uniqueBy: [
      ['petId', 'userId']
    ]
  },
  users: {
    factory: () => ({
      userId: faker.random.uuid(),
      email: faker.internet.email(),
      username: faker.internet.userName(),
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName()
    }),
    uniqueBy: [
      'userId',
      'email',
      'username',
      ['firstName', 'lastName'],
      ({ firstName }) => firstName + 'five'
    ]
  }
})

it('creates a single record', () => {
  records.press(build => build.users({
    username: 'cmdshift'
  }))
  const [{ type, rows: [user] }] = records.dump()
  expect(type).to.equal('users')
  expect(user).to.include({
    username: 'cmdshift'
  })
})

it('creates multiple records', () => {
  records.press(build => build.users([
    { username: 'moe' },
    { username: 'curly' },
    { username: 'larry' }
  ]))
  const [{ type, rows: [moe, curly, larry] }] = records.dump()
  expect(type).to.equal('users')
  expect(moe).to.include({ username: 'moe' })
  expect(curly).to.include({ username: 'curly' })
  expect(larry).to.include({ username: 'larry' })
})

it('creates records of different types', () => {
  records.press(build => {
    const [{ userId }] = build.users({
      username: 'john'
    })
    const pets = build.pets([
      { breed: 'cat' },
      { breed: 'dog' }
    ])
    build.petOwners(pets.map(({ petId }) => ({
      userId,
      petId
    })))
  })
  const [users, pets, petOwners] = records.dump()
  petOwners.rows.forEach(({ userId, petId }, index) => {
    expect(userId).to.equal(users.rows[0].userId)
    expect(petId).to.equal(pets.rows[index].petId)
  })
})

it('creates records with unique keys', () => {
  const nonUniqueKey = (): void => {
    records.press(build => build.users([
      { username: 'moe' },
      { username: 'moe' }
    ], { retries: 5 }))
  }
  expect(nonUniqueKey).to.throw(
    Error,
    'failed to create unique "users" row after 5 retries'
  )
})

it('creates records with unique composite keys', () => {
  const nonUniqueCompositeKeys = (): void => {
    records.press(build => build.users([
      { firstName: 'joey', lastName: 'joe-joe' },
      { firstName: 'joey', lastName: 'joe-joe' }
    ], { retries: 5 }))
  }
  expect(nonUniqueCompositeKeys).to.throw(
    Error,
    'failed to create unique "users" row after 5 retries'
  )
})

it('creates records with unique computed keys', () => {
  const nonUniqueComputedKeys = (): void => {
    records.press(build => build.users([
      { firstName: 'johnny' },
      { firstName: 'johnny' }
    ], { retries: 5 }))
  }
  expect(nonUniqueComputedKeys).to.throw(
    Error,
    'failed to create unique "users" row after 5 retries'
  )
})
