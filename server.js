import { ApolloServer } from 'apollo-server-express'
import { graphqlUploadExpress } from 'graphql-upload'
import express from 'express'
import { typeDefs, resolvers } from './schema/schema.js'

const port = 4000 || process.env.PORT

const startApolloServer = async () => {
   const server = new ApolloServer({ typeDefs, resolvers })
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
