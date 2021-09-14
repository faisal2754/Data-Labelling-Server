const { ApolloServer } = require('apollo-server-express')
const { graphqlUploadExpress } = require('graphql-upload')
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
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
   app.use(function (req, res, next) {
      // Website you wish to allow to connect
      res.setHeader(
         'Access-Control-Allow-Origin',
         'https://faisal2754.github.io'
      )

      // Request methods you wish to allow
      // res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

      // Request headers you wish to allow
      // res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

      // Set to true if you need the website to include cookies in the requests sent
      // to the API (e.g. in case you use sessions)
      // res.setHeader('Access-Control-Allow-Credentials', true);

      // Pass to next layer of middleware
      next()
   })
   app.use(cookieParser())
   app.use(graphqlUploadExpress())
   app.use(
      cors({
         origin: [
            'http://localhost:3000',
            'https://faisal2754.github.io',
            'http://127.0.0.1:5500'
         ],
         credentials: true
      })
   )
   server.applyMiddleware({ app, cors: false })

   await new Promise((resolve) => app.listen({ port }, resolve))
   console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
}

startApolloServer().catch((e) => {
   console.log(e)
})
