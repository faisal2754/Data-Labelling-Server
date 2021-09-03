const { gql } = require('apollo-server-express')

const BRUH = gql`
   query Bruh {
      bruh
   }
`

const ME = gql`
   query Me {
      me {
         email
      }
   }
`

const VIEW_JOBS = gql`
   query ViewJobs {
      viewJobs {
         job_id
      }
   }
`

module.exports = { BRUH, ME, VIEW_JOBS }
