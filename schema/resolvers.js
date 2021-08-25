const { GraphQLUpload } = require('graphql-upload')
const GraphQLDate = require('graphql-date')
const prisma = require('../prisma/client')
const queries = require('./queries')
const mutations = require('./mutations')

const resolvers = {
   Upload: GraphQLUpload,
   Date: GraphQLDate,

   Job: {
      job_owner: async (parent) => {
         const user = await prisma.user.findFirst({
            where: {
               user_id: parent.job_owner_id
            }
         })

         return user
      }
   },

   Query: queries,

   Mutation: mutations
}

module.exports = resolvers
