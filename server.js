import { ApolloServer } from 'apollo-server-express'
import { graphqlUploadExpress } from 'graphql-upload'
import express from 'express'
import { typeDefs, resolvers } from './schema/schema.js'
import { getUser } from './utils/getUser.js'

const port = process.env.PORT || 4000

const startApolloServer = async () => {
   const server = new ApolloServer({
      typeDefs,
      resolvers,
      context: async ({ req }) => {
         const authHeader = req.headers.authorization
         const user = await getUser(authHeader)
         return { user }
      }
   })
   await server.start()

   const app = express()
   app.use(graphqlUploadExpress())
   server.applyMiddleware({ app })

   await new Promise((resolve) => app.listen({ port }, resolve))
   console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
}

startApolloServer().catch((e) => {
   console.log(e)
})
