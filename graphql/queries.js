const { gql } = require('apollo-server-express')

const BRUH = gql`
   query {
      bruh
   }
`

const GET_USERS = gql`
   query {
      users {
         username
      }
   }
`

module.exports = { BRUH, GET_USERS }
