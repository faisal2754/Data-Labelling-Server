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

const LABEL_JOB_INFO = gql`
   query LabelJobInfo($job_id: ID!) {
      labelJobInfo(job_id: $job_id) {
         partition_id
         labels
         image_ids
      }
   }
`

const LABEL_JOB_STATE = gql`
   query LabelJobState($partition_id: ID!) {
      labelJobState(partition_id: $partition_id) {
         image_ids
      }
   }
`

const OWNED_JOBS = gql`
   query OwnedJobs {
      ownedJobs {
         job_id
      }
   }
`

const ACCEPTED_JOBS = gql`
   query AcceptedJobs {
      acceptedJobs {
         job_id
      }
   }
`

module.exports = {
   BRUH,
   ME,
   VIEW_JOBS,
   LABEL_JOB_INFO,
   LABEL_JOB_STATE,
   OWNED_JOBS,
   ACCEPTED_JOBS
}
