const { ApolloServer } = require('apollo-server-express')
const { createTestClient } = require('apollo-server-integration-testing')
const config = require('../apollo/config')
const { REGISTER, LOGIN } = require('../graphql/mutations')
const prisma = require('../prisma/client')

let apolloServer, query, mutate

beforeAll(async () => {
   apolloServer = new ApolloServer(config)
   await apolloServer.start()

   const testClient = createTestClient({
      apolloServer
   })

   query = testClient.query
   mutate = testClient.mutate
})

describe('User Authentication', () => {
   it('should allow users to register', async () => {
      const result = await mutate(REGISTER, {
         variables: {
            username: 'jest',
            email: 'jest@test.com',
            password: '123'
         }
      })

      expect(result).toEqual({
         data: {
            register: {
               email: 'jest@test.com'
            }
         }
      })
   })

   it('should allow users to log in', async () => {
      const result = await mutate(LOGIN, {
         variables: {
            email: 'jest@test.com',
            password: '123'
         }
      })

      const { jwt } = result.data.login

      expect(jwt).toBeDefined()
   })
})

afterAll(async () => {
   await prisma.user.deleteMany()
   await prisma.$disconnect()
   await apolloServer.stop()
})
