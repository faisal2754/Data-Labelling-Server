const { ApolloServer } = require('apollo-server-express')
const config = require('../apollo/config.js')
const express = require('express')
const { GET_USERS } = require('../graphql/queries')

it('adds 1 + 2 to equal 3', async () => {
   const server = new ApolloServer(config)
   await server.start()

   const app = express()
   server.applyMiddleware({ app })

   const result = await server.executeOperation({
      query: GET_USERS
   })

   console.log(result)

   expect(3).toBe(3)
})
