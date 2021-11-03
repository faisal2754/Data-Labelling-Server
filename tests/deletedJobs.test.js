const { ApolloServer } = require('apollo-server-express')
const express = require('express')
const { graphqlUploadExpress } = require('graphql-upload')
const { createTestClient } = require('apollo-server-integration-testing')
const config = require('../apollo/config')
const { DELETED_JOBS } = require('../graphql/queries')
const {
   REGISTER,
   ACCEPT_JOB,
   SAVE_STATE,
   DELETE_JOB
} = require('../graphql/mutations')
const prisma = require('../prisma/client')
const FormData = require('form-data')
const fs = require('fs')
const axios = require('axios').default
const { ok } = require('assert')

jest.setTimeout(30000)

let apolloServer, query, mutate, setOptions

beforeAll(async () => {
   apolloServer = new ApolloServer(config)
   await apolloServer.start()

   const app = express()
   app.use(graphqlUploadExpress())
   apolloServer.applyMiddleware({ app })

   await new Promise((resolve) => app.listen({ port: 4007 }, resolve))

   const testClient = createTestClient({
      apolloServer
   })

   query = testClient.query
   mutate = testClient.mutate
   setOptions = testClient.setOptions
})

afterAll(async () => {
   await prisma.image_label.deleteMany()
   await prisma.job_image.deleteMany()
   await prisma.job_labeller.deleteMany()
   await prisma.job_partition.deleteMany()
   await prisma.job_label.deleteMany()
   await prisma.job.deleteMany()
   await prisma.user.deleteMany()
   await prisma.$disconnect()
   await apolloServer.stop()
})

describe('Should return deleted jobs of user', () => {
   let jwt, jobId

   it('registers a new user', async () => {
      const result = await mutate(REGISTER, {
         variables: {
            username: 'jest',
            email: 'jest@test.com',
            password: '123'
         }
      })

      jwt = result.data.register.jwt

      expect(result).toEqual({
         data: {
            register: {
               email: 'jest@test.com',
               jwt: jwt
            }
         }
      })
   })

   it('should create a job', async () => {
      const form = new FormData()

      form.append(
         'operations',
         JSON.stringify({
            query: 'mutation ($files: [Upload], $title: String!, $description: String!, $credits: Int!, $num_partitions: Int!, $labels: [String]!){\n  createJob (files: $files, title: $title, description: $description, credits: $credits, num_partitions: $num_partitions, labels: $labels){\n    job_id\n  }\n}',
            variables: {
               files: [],
               title: 'testing job',
               description: 'abc',
               credits: 5,
               num_partitions: 2,
               labels: ['apple', 'banana', 'cherry']
            }
         })
      )
      form.append(
         'map',
         JSON.stringify({
            0: ['variables.files.0']
         })
      )
      form.append('0', fs.createReadStream('tests/temp.txt'), {
         filename: 'temp.txt'
      })

      const headers = Object.assign(
         {
            Accept: 'application/json',
            authorization: `Bearer ${jwt}`
         },
         form.getHeaders()
      )

      const res = await axios.post('http://localhost:4007/graphql', form, {
         headers
      })

      jobId = res.data.data.createJob.job_id

      ok(jobId)
   })

   it('should accept a job', async () => {
      setOptions({
         request: {
            headers: {
               authorization: `Bearer ${jwt}`
            }
         }
      })

      const result = await mutate(ACCEPT_JOB, {
         variables: {
            job_id: jobId
         }
      })

      expect(result).toEqual({
         data: {
            acceptJob: true
         }
      })
   })

   it('should deleted the job', async () => {
      setOptions({
         request: {
            headers: {
               authorization: `Bearer ${jwt}`
            }
         }
      })

      const deleted = await mutate(DELETE_JOB, {
         variables: {
            job_id: jobId
         }
      })

      ok(deleted)
   })

   it("should return the user's deleted jobs", async () => {
      setOptions({
         request: {
            headers: {
               authorization: `Bearer ${jwt}`
            }
         }
      })

      const result = await query(DELETED_JOBS)

      expect(result).toEqual({
         data: {
            deletedJobs: [
               {
                  job_id: jobId
               }
            ]
         }
      })
   })
})
