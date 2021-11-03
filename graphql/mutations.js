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

const EDIT_PROFILE = gql`
   mutation EditProfile($username: String, $password: String, $avatar: String) {
      editProfile(username: $username, password: $password, avatar: $avatar) {
         username
         avatar
      }
   }
`

const ACCEPT_JOB = gql`
   mutation AcceptJob($job_id: ID!) {
      acceptJob(job_id: $job_id)
   }
`

const SAVE_STATE = gql`
   mutation SaveState(
      $image_ids: [ID]!
      $labels: [String]!
      $partition_id: ID
      $is_complete: Boolean
   ) {
      saveState(
         image_ids: $image_ids
         labels: $labels
         partition_id: $partition_id
         is_complete: $is_complete
      )
   }
`

const DELETE_JOB = gql`
   mutation DeleteJob($job_id: ID!) {
      deleteJob(job_id: $job_id)
   }
`

const JOB_RESULTS = gql`
   mutation JobResults($job_id: ID!) {
      jobResults(job_id: $job_id)
   }
`

module.exports = {
   REGISTER,
   LOGIN,
   CREATE_JOB,
   EDIT_PROFILE,
   ACCEPT_JOB,
   SAVE_STATE,
   DELETE_JOB,
   JOB_RESULTS
}
