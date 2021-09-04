const { ApolloServer } = require('apollo-server-express')
const { createTestClient } = require('apollo-server-integration-testing')
const config = require('../apollo/config')
const { ME } = require('../graphql/queries')
const { REGISTER } = require('../graphql/mutations')
const prisma = require('../prisma/client')

let apolloServer, query, mutate, setOptions

beforeAll(async () => {
   apolloServer = new ApolloServer(config)
   await apolloServer.start()

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

xdescribe('Me checks the current logged in user', () => {
   let jwt
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

   it('should return the authenticated user', async () => {
      setOptions({
         request: {
            headers: {
               authorization: `Bearer ${jwt}`
            }
         }
      })

      const result = await query(ME)
      const email = result.data.me.email

      expect(email).toEqual('jest@test.com')
   })
})
