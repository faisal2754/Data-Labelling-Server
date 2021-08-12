import { gql } from 'apollo-server-express'
import { GraphQLUpload } from 'graphql-upload'
import argon2 from 'argon2'
import fs from 'fs'
import jwt from 'jsonwebtoken'
import { GoogleService } from '../google/GoogleServices.js'
import client from '@prisma/client'
const { PrismaClient } = client

const prisma = new PrismaClient()
const googleService = new GoogleService()

const typeDefs = gql`
   scalar Upload

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

   type Query {
      users: [User]!
      user(email: String!): User!
   }

   type Mutation {
      register(username: String!, email: String!, password: String!): User!
      login(email: String!, password: String!): User
      storageUpload(file: Upload!): File!
      streamUpload(file: Upload!): File!
   }
`
const resolvers = {
   Upload: GraphQLUpload,

   Query: {
      users: async () => {
         const users = await prisma.users.findMany()
         return users
      },
      user: async (_, { email }, { user }) => {
         if (!user) throw new Error('Please login.')

         const otherUser = await prisma.users.findFirst({
            where: {
               email: email
            }
         })
         return otherUser
      }
   },

   Mutation: {
      register: async (_, { username, email, password }) => {
         const hashedPass = await argon2.hash(password)
         const user = await prisma.users.create({
            data: {
               username: username,
               email: email,
               password: hashedPass
            }
         })

         if (!user) throw new Error('Registration failed :`(')

         user.jwt = jwt.sign({ user_id: user.user_id }, process.env.JWT_SECRET)

         return user
      },
      login: async (_, { email, password }) => {
         const user = await prisma.users.findUnique({
            where: {
               email: email
            }
         })

         if (!user) throw new Error('Email not found')

         if (!(await argon2.verify(user.password, password))) {
            throw new Error('Password incorrect')
         }

         user.jwt = jwt.sign({ user_id: user.user_id }, process.env.JWT_SECRET)

         return user
      },
      storageUpload: async (_, { file }) => {
         const { createReadStream, filename, mimetype } = await file

         const fileStream = createReadStream()
         fileStream.pipe(fs.createWriteStream(`./uploadedFiles/${filename}`))

         return file
      },
      streamUpload: async (_, { file }) => {
         const { createReadStream, filename, mimetype } = await file
         const fileStream = createReadStream()

         const result = await googleService.uploadStream(filename, fileStream)

         //https://drive.google.com/uc?id

         return file
      }
   }
}

export { typeDefs, resolvers }
