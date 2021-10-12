const { ApolloServer } = require('apollo-server-express')
const express = require('express')
const { graphqlUploadExpress } = require('graphql-upload')
const { createTestClient } = require('apollo-server-integration-testing')
const config = require('../apollo/config')
const { LABEL_JOB_INFO, LABEL_JOB_STATE } = require('../graphql/queries')
const { REGISTER, ACCEPT_JOB, SAVE_STATE } = require('../graphql/mutations')
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

   await new Promise((resolve) => app.listen({ port: 4004 }, resolve))

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

describe('Should save a jobs state', () => {
   let jwt, jobId, partitionId, imageIds, labels

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
            0: ['variables.files.0'],
            1: ['variables.files.1'],
            2: ['variables.files.2'],
            3: ['variables.files.3']
         })
      )
      form.append('0', fs.createReadStream('tests/temp.txt'), {
         filename: 'temp.txt'
      })
      form.append('1', fs.createReadStream('tests/temp.txt'), {
         filename: 'temp.txt'
      })
      form.append('2', fs.createReadStream('tests/temp.txt'), {
         filename: 'temp.txt'
      })
      form.append('3', fs.createReadStream('tests/temp.txt'), {
         filename: 'temp.txt'
      })

      const headers = Object.assign(
         {
            Accept: 'application/json',
            authorization: `Bearer ${jwt}`
         },
         form.getHeaders()
      )

      const res = await axios.post('http://localhost:4004/graphql', form, {
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

   it("should return a job's information", async () => {
      setOptions({
         request: {
            headers: {
               authorization: `Bearer ${jwt}`
            }
         }
      })

      const result = await query(LABEL_JOB_INFO, {
         variables: {
            job_id: jobId
         }
      })

      partitionId = result.data.labelJobInfo.partition_id
      imageIds = result.data.labelJobInfo.image_ids
      labels = result.data.labelJobInfo.labels

      ok(partitionId)
   })

   it('should save a jobs state', async () => {
      const imageLabels = [labels[0], labels[1]]

      setOptions({
         request: {
            headers: {
               authorization: `Bearer ${jwt}`
            }
         }
      })

      const result = await mutate(SAVE_STATE, {
         variables: {
            image_ids: imageIds,
            labels: imageLabels,
            partition_id: partitionId,
            is_complete: true
         }
      })

      ok(result)
   })

   it('should restore a jobs state', async () => {
      setOptions({
         request: {
            headers: {
               authorization: `Bearer ${jwt}`
            }
         }
      })

      const result = await query(LABEL_JOB_STATE, {
         variables: {
            partition_id: partitionId
         }
      })

      expect(result.data.labelJobState.image_ids).toEqual(imageIds)
   })
})
