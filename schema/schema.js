import { gql } from 'apollo-server-express'
import { GraphQLUpload } from 'graphql-upload'
import fs from 'fs'

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
      singleUpload(file: Upload!): File!
   }
`
const resolvers = {
   Upload: GraphQLUpload,

   Query: {
      books: () => books
   },

   Mutation: {
      singleUpload: (_, args) => {
         return args.file.then((file) => {
            const { createReadStream, filename, mimetype } = file

            const fileStream = createReadStream()

            console.log(fileStream)

            fileStream.pipe(fs.createWriteStream(`./uploadedFiles/${filename}`))

            return file
         })
      }
   }
}

export { typeDefs, resolvers }
