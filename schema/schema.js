const { gql } = require('apollo-server-express')
const { GraphQLUpload } = require('graphql-upload')
const GraphQLDate = require('graphql-date')
const argon2 = require('argon2')
const fs = require('fs')
const jwt = require('jsonwebtoken')
const GoogleDrive = require('../google/GoogleDrive')
const prisma = require('../prisma/client')
const { $connect } = require('../prisma/client')

const gDrive = new GoogleDrive()

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
   }

   type Query {
      users: [User]
      user(email: String!): User
   }

   type Mutation {
      register(username: String!, email: String!, password: String!): User
      login(email: String!, password: String!): User
      storageUpload(file: [Upload], temp: String): [File]
      streamUpload(file: Upload!): File
      createJob(
         title: String!
         description: String!
         credits: Int!
         num_partitions: Int!
         files: [Upload]
      ): Job
   }
`
const resolvers = {
   Upload: GraphQLUpload,
   Date: GraphQLDate,

   Query: {
      users: async () => {
         const users = await prisma.user.findMany()
         return users
      },
      user: async (_, { email }) => {
         const user = await prisma.user.findFirst({
            where: {
               email: email
            }
         })
         return user
      }
   },

   Mutation: {
      register: async (_, { username, email, password }) => {
         const hashedPass = await argon2.hash(password)
         const user = await prisma.user.create({
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
         const user = await prisma.user.findUnique({
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

      createJob: async (
         _,
         { title, description, credits, num_partitions, files }
      ) => {
         // Job metadata
         const job_owner_id = 3
         const job = await prisma.job.create({
            data: { title, description, credits, job_owner_id }
         })

         if (!job) throw new Error('Error creating job.')

         // Partition creation
         const encodedFiles = await Promise.all(files)
         const numImages = encodedFiles.length

         let partitionInfo = {
            splitArr: [],
            ids: []
         }

         const partitionSize = Math.floor(numImages / num_partitions)

         for (let i = 0; i < num_partitions - 1; i++) {
            partitionInfo.splitArr.push(
               encodedFiles.slice(i * partitionSize, (i + 1) * partitionSize)
                  .length
            )

            partitionInfo.ids.push(
               await prisma.job_partition.create({
                  data: {
                     job_id: job.job_id,
                     partition_number: i
                  }
               })
            )
         }

         partitionInfo.splitArr.push(
            encodedFiles.slice((num_partitions - 1) * partitionSize).length
         )

         partitionInfo.ids.push(
            await prisma.job_partition.create({
               data: {
                  job_id: job.job_id,
                  partition_number: num_partitions - 1
               }
            })
         )

         // Job images
         let filenames = []
         let streams = []

         for (let i = 0; i < numImages; i++) {
            const { createReadStream, filename } = await encodedFiles[i]

            filenames.push(filename)
            var stream = createReadStream()
            streams.push(stream)
         }

         const imgIds = await gDrive.uploadStreams(filenames, streams)

         const urls = imgIds.map(
            (imgId) => `https://drive.google.com/uc?id=${imgId}`
         )

         // Image table population
         let startIdx = 0
         for (let i = 0; i < partitionInfo.splitArr.length; i++) {
            for (let j = 0; j < partitionInfo.splitArr[i]; j++) {
               await prisma.job_image.create({
                  data: {
                     image_uri: urls[j + startIdx],
                     partition_id: partitionInfo.ids[i].partition_id
                  }
               })
            }

            startIdx = partitionInfo.splitArr[i]
         }

         return job
      },

      storageUpload: async (_, args) => {
         let filenames = []
         let streams = []

         const encodedFiles = await Promise.all(args.file)

         for (let i = 0; i < encodedFiles.length; i++) {
            const { createReadStream, filename } = await encodedFiles[i]

            filenames.push(filename)
            var stream = createReadStream()
            streams.push(stream)
         }

         const imgIds = await gDrive.uploadStreams(filenames, streams)

         return encodedFiles
      },
      streamUpload: async (_, { file }) => {
         const { createReadStream, filename, mimetype } = await file
         const fileStream = createReadStream()

         const result = await gDrive.uploadStream(filename, fileStream)

         //https://drive.google.com/uc?id

         return file
      }
   }
}

module.exports = { typeDefs, resolvers }
