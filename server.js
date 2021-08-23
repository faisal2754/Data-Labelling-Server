const { ApolloServer } = require('apollo-server-express')
const { graphqlUploadExpress } = require('graphql-upload')
const express = require('express')
const cors = require('cors')
const config = require('./apollo/config')
if (process.env.NODE_ENV !== 'production') {
   const dotenv = require('dotenv')
   dotenv.config()
}

const port = process.env.PORT || 4000

const startApolloServer = async () => {
   const server = new ApolloServer(config)
   await server.start()

   const app = express()
   app.use(graphqlUploadExpress())
   app.use(cors())
   server.applyMiddleware({ app, cors: false })

   await new Promise((resolve) => app.listen({ port }, resolve))
   console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
}

startApolloServer().catch((e) => {
   console.log(e)
})
