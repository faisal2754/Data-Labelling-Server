const { typeDefs, resolvers } = require('../schema/schema.js')
const { getUser } = require('../utils/getUser.js')

const config = {
   typeDefs,
   resolvers,
   context: async ({ req }) => {
      const authHeader = req.headers.authorization
      const user = await getUser(authHeader)
      return { user }
   }
}

module.exports = config
