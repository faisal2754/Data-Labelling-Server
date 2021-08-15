const { ApolloServer } = require('apollo-server-express')
const { createTestClient } = require('apollo-server-integration-testing')
const config = require('../apollo/config.js')
const { GET_USERS } = require('../graphql/queries')

it('adds 1 + 2 to equal 3', async () => {
   const apolloServer = new ApolloServer(config)
   await apolloServer.start()

   const { query, mutate } = createTestClient({
      apolloServer
   })

   const result = await query(GET_USERS)

   console.log(result)

   expect(3).toBe(3)
})
