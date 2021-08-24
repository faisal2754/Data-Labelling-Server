const typeDefs = require('../schema/typeDefs.js')
const resolvers = require('../schema/resolvers.js')
const { getUser } = require('../utils/getUser.js')

const config = {
   typeDefs,
   resolvers,
   introspection: true,
   context: async ({ req, res }) => {
      const authHeader = req.headers.authorization
      const user = await getUser(authHeader)

      return { user, res }
   }
}

module.exports = config
