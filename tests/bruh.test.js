const { ApolloServer } = require('apollo-server-express')
const { createTestClient } = require('apollo-server-integration-testing')
const config = require('../apollo/config')
const { BRUH } = require('../graphql/queries')

beforeAll(async () => {
   apolloServer = new ApolloServer(config)
   await apolloServer.start()

   const testClient = createTestClient({
      apolloServer
   })

   query = testClient.query
   mutate = testClient.mutate
   setOptions = testClient.setOptions
})

describe('Bruh should bruh', () => {
   it('should return bruh', async () => {
      const result = await query(BRUH)
      expect(result.data.bruh).toEqual('bruh')
   })
})
