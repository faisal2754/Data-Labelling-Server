import { gql } from 'apollo-server-express'
import { GraphQLUpload } from 'graphql-upload'
import fs from 'fs'
import { GoogleService } from '../google/GoogleServices.js'
import client from '@prisma/client'
const { PrismaClient } = client

const prisma = new PrismaClient()
const googleService = new GoogleService()

const books = [
   {
      title: 'The Awakening',
      author: 'Kate Chopin'
   },
   {
      title: 'City of Glass',
      author: 'Paul Auster'
   }
]

const typeDefs = gql`
   scalar Upload

   type Book {
      title: String
      author: String
   }

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
   }

   type Query {
      books: [Book]
      users: [User]
      user(email: String!): User
   }

   type Mutation {
      storageUpload(file: Upload!): File!
      streamUpload(file: Upload!): File!
   }
`
const resolvers = {
   Upload: GraphQLUpload,

   Query: {
      books: () => books,
      users: async () => {
         try {
            const users = await prisma.users.findMany()
            return users
         } catch (e) {
            throw new Error(e)
         }
      },
      user: async (_, { email }) => {
         try {
            const user = await prisma.users.findFirst({
               where: {
                  email: email
               }
            })
            return user
         } catch (e) {
            throw new Error(e)
         }
      }
   },

   Mutation: {
      storageUpload: async (_, args) => {
         const file = await args.file
         const { createReadStream, filename, mimetype } = file

         const fileStream = createReadStream()
         fileStream.pipe(fs.createWriteStream(`./uploadedFiles/${filename}`))

         return file
      },

      streamUpload: async (_, args) => {
         const file = await args.file
         const { createReadStream, filename, mimetype } = file
         const fileStream = createReadStream()

         const result = await googleService.uploadStream(filename, fileStream)

         //https://drive.google.com/uc?id

         return file
      }
   }
}

export { typeDefs, resolvers }
