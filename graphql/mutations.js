const { gql } = require('apollo-server-express')

const REGISTER = gql`
   mutation Register($username: String!, $email: String!, $password: String!) {
      register(username: $username, email: $email, password: $password) {
         email
      }
   }
`

const LOGIN = gql`
   mutation Login($email: String!, $password: String!) {
      login(email: $email, password: $password) {
         jwt
      }
   }
`

module.exports = { REGISTER, LOGIN }
