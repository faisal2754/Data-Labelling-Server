const { ApolloServer } = require('apollo-server-express')
const express = require('express')
const { graphqlUploadExpress } = require('graphql-upload')
const { createTestClient } = require('apollo-server-integration-testing')
const config = require('../apollo/config')
const { CREATE_JOB, REGISTER } = require('../graphql/mutations')
const { VIEW_JOB, VIEW_JOBS } = require('../graphql/queries')
const prisma = require('../prisma/client')
const FormData = require('form-data')
const fs = require('fs')
const axios = require('axios').default
const { ok } = require('assert')

let apolloServer, query, mutate, setOptions

beforeAll(async () => {
   apolloServer = new ApolloServer(config)
   await apolloServer.start()

   const app = express()
   app.use(graphqlUploadExpress())
   apolloServer.applyMiddleware({ app })

   await new Promise((resolve) => app.listen({ port: 4000 }, resolve))

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

xdescribe('ViewJobs returns all the existing jobs', () => {
   let jwt, newJobId

   it('should register a new user', async () => {
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
               credits: 2,
               num_partitions: 2,
               labels: ['apple', 'banana', 'cherry']
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
            authorization: `Bearer ${jwt}`
         },
         form.getHeaders()
      )

      const res = await axios.post('http://localhost:4000/graphql', form, {
         headers
      })

      newJobId = res.data.data.createJob.job_id

      ok(newJobId)
   })

   it('should return no jobs because you own them', async () => {
      setOptions({
         request: {
            headers: {
               authorization: `Bearer ${jwt}`
            }
         }
      })

      const result = await query(VIEW_JOBS)
      const jobs = result.data.viewJobs

      expect(jobs).toEqual([])
   })

   it('should return all the jobs in the db', async () => {
      setOptions({
         request: {
            headers: {
               authorization: ''
            }
         }
      })

      const result = await query(VIEW_JOBS)
      const jobs = result.data.viewJobs

      expect(jobs[0].job_id).toEqual(newJobId)
   })
})
