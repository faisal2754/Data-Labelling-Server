const { gql } = require('apollo-server-express')

const GET_USERS = gql`
   query {
      users {
         username
      }
   }
`

module.exports = { GET_USERS }
