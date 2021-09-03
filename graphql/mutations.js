const { gql } = require('apollo-server-express')

const REGISTER = gql`
   mutation Register($username: String!, $email: String!, $password: String!) {
      register(username: $username, email: $email, password: $password) {
         email
         jwt
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

const CREATE_JOB = gql`
   mutation CreateJob(
      $title: String!
      $description: String!
      $credits: Int!
      $labels: [String]!
      $num_partitions: Int!
   ) {
      createJob(
         title: $title
         description: $description
         credits: $credits
         labels: $labels
         num_partitions: $num_partitions
      ) {
         job_id
      }
   }
`

module.exports = { REGISTER, LOGIN, CREATE_JOB }
