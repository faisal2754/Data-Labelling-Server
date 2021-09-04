const { ApolloServer } = require('apollo-server-express')
const { createTestClient } = require('apollo-server-integration-testing')
const config = require('../apollo/config')
const argon2 = require('argon2')
const { REGISTER, EDIT_PROFILE } = require('../graphql/mutations')
const prisma = require('../prisma/client')

let apolloServer, setOptions, mutate

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

xdescribe('EditProfile lets users modify their account info', () => {
   let jwt

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

   it("modifies the registered user's details", async () => {
      setOptions({
         request: {
            headers: {
               authorization: `Bearer ${jwt}`
            }
         }
      })

      const newDetails = {
         username: 'jest1',
         password: 'newPass',
         avatar: 'pic.jpeg'
      }

      const result = await mutate(EDIT_PROFILE, {
         variables: newDetails
      })

      expect(result).toEqual({
         data: {
            editProfile: {
               username: newDetails.username,
               password: await argon2.hash(newDetails.password),
               avatar: newDetails.avatar
            }
         }
      })
   })
})
