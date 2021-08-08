import { gql } from 'apollo-server-express'
import { GraphQLUpload } from 'graphql-upload'
import { google } from 'googleapis'
import fs from 'fs'
import { GoogleService } from '../utils/GoogleServices.js'

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

   type Query {
      books: [Book]
   }

   type Mutation {
      storageUpload(file: Upload!): File!
      streamUpload(file: Upload!): File!
   }
`
const resolvers = {
   Upload: GraphQLUpload,

   Query: {
      books: () => books
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
