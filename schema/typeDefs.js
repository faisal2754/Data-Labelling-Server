const { gql } = require('apollo-server-express')

const typeDefs = gql`
   scalar Upload
   scalar Date

   type File {
      filename: String!
      mimetype: String!
      encoding: String!
   }

   type User {
      user_id: ID!
      username: String!
      email: String!
      password: String!
      avatar: String
      balance: Int
      jwt: String
   }

   type Job {
      job_id: ID!
      job_owner_id: Int!
      title: String!
      description: String!
      credits: Int!
      created_at: Date!
      preview_images: [String]
   }

   type Query {
      users: [User]
      user(email: String!): User
      viewJobs: [Job]
   }

   type Mutation {
      register(username: String!, email: String!, password: String!): User
      login(email: String!, password: String!): User
      editProfile(username: String, password: String, avatar: String): User
      createJob(
         title: String!
         description: String!
         credits: Int!
         labels: [String]!
         num_partitions: Int!
         files: [Upload]
      ): Job
      acceptJob(job_id: ID!): Boolean
   }
`

module.exports = typeDefs
