const { ApolloServer } = require('apollo-server-express')
const express = require('express')
const { graphqlUploadExpress } = require('graphql-upload')
const { createTestClient } = require('apollo-server-integration-testing')
const config = require('../apollo/config')
const { LABEL_JOB_INFO } = require('../graphql/queries')
const {
   REGISTER,
   ACCEPT_JOB,
   SAVE_STATE,
   JOB_RESULTS
} = require('../graphql/mutations')
const prisma = require('../prisma/client')
const FormData = require('form-data')
const fs = require('fs')
const axios = require('axios').default
const { ok } = require('assert')

jest.setTimeout(30000)

let apolloServer

beforeAll(async () => {
   apolloServer = new ApolloServer(config)
   await apolloServer.start()

   const app = express()
   app.use(graphqlUploadExpress())
   apolloServer.applyMiddleware({ app })

   await new Promise((resolve) => app.listen({ port: 4010 }, resolve))

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

describe("It should return a job's results", () => {
   let jobId, partitionId, labels, imageIds
   let jwt = []

   it('registers 3 new users', async () => {
      const result0 = await mutate(REGISTER, {
         variables: {
            username: 'jest',
            email: 'jest0@test.com',
            password: '123'
         }
      })
      const result1 = await mutate(REGISTER, {
         variables: {
            username: 'jest',
            email: 'jest1@test.com',
            password: '123'
         }
      })
      const result2 = await mutate(REGISTER, {
         variables: {
            username: 'jest',
            email: 'jest2@test.com',
            password: '123'
         }
      })

      jwt.push(result0.data.register.jwt)
      jwt.push(result1.data.register.jwt)
      jwt.push(result2.data.register.jwt)

      expect(result0).toEqual({
         data: {
            register: {
               email: 'jest0@test.com',
               jwt: jwt[0]
            }
         }
      })
      expect(result1).toEqual({
         data: {
            register: {
               email: 'jest1@test.com',
               jwt: jwt[1]
            }
         }
      })
      expect(result2).toEqual({
         data: {
            register: {
               email: 'jest2@test.com',
               jwt: jwt[2]
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
               credits: 500,
               num_partitions: 1,
               labels: ['apple', 'other']
            }
         })
      )
      form.append(
         'map',
         JSON.stringify({
            0: ['variables.files.0'],
            1: ['variables.files.1']
         })
      )
      form.append('0', fs.createReadStream('tests/temp.txt'), {
         filename: 'temp.txt'
      })
      form.append('1', fs.createReadStream('tests/temp.txt'), {
         filename: 'temp.txt'
      })

      const headers = Object.assign(
         {
            Accept: 'application/json',
            authorization: `Bearer ${jwt[0]}`
         },
         form.getHeaders()
      )

      const res = await axios.post('http://localhost:4010/graphql', form, {
         headers
      })

      jobId = res.data.data.createJob.job_id

      ok(jobId)
   })

   it('should let 3 users accept the job', async () => {
      for (let i = 0; i < 3; i++) {
         setOptions({
            request: {
               headers: {
                  authorization: `Bearer ${jwt[i]}`
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
      }
   })

   it("should return each user's job's information", async () => {
      for (let i = 0; i < 3; i++) {
         setOptions({
            request: {
               headers: {
                  authorization: `Bearer ${jwt[i]}`
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
      }
   })

   it('should let all users label their jobs', async () => {
      const imageLabels = [labels[0], labels[0]]

      for (let i = 0; i < 3; i++) {
         setOptions({
            request: {
               headers: {
                  authorization: `Bearer ${jwt[i]}`
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
      }
   })

   it("should return the completed job's results", async () => {
      setOptions({
         request: {
            headers: {
               authorization: `Bearer ${jwt[0]}`
            }
         }
      })

      const result = await mutate(JOB_RESULTS, {
         variables: {
            job_id: jobId
         }
      })

      ok(result)
   })
})
