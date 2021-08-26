const prisma = require('../prisma/client')

const queries = {
   me: async (_, __, { user }) => {
      return user
   },

   users: async () => {
      const users = await prisma.user.findMany()
      return users
   },

   user: async (_, { email }) => {
      const user = await prisma.user.findFirst({
         where: {
            email: email
         }
      })
      return user
   },

   viewJobs: async () => {
      const job_owner_id = 4

      const jobs = await prisma.job.findMany({
         where: {
            NOT: {
               job_owner_id: job_owner_id
            }
         }
      })

      // DISGUSTING
      const getAvailableJobs = async () => {
         let availableJobs = []

         for (let i = 0; i < jobs.length; i++) {
            const partitions = await prisma.job_partition.findMany({
               where: {
                  AND: [{ job_id: jobs[i].job_id }, { is_full: false }]
               }
            })

            if (partitions.length > 0) {
               availableJobs.push(jobs[i])
            }
         }

         return availableJobs
      }
      //END

      const availableJobs = await getAvailableJobs()

      const jobsWithImages = availableJobs.map(async (job) => {
         const partition = await prisma.job_partition.findFirst({
            where: {
               job_id: job.job_id
            }
         })

         const previewImages = await prisma.job_image.findMany({
            where: {
               partition_id: partition.partition_id
            },
            take: 5
         })

         job.preview_images = previewImages.map(
            (jobImage) => jobImage.image_uri
         )
         return job
      })

      return jobsWithImages
   },

   labelJobInfo: async (_, { job_id }, { user }) => {
      const jobTitle = (
         await prisma.job.findFirst({
            where: { job_id: Number(job_id) }
         })
      ).title

      const partitionId = (
         await prisma.job_labeller.findFirst({
            where: {
               AND: [{ job_id: Number(job_id) }, { user_id: user.user_id }]
            }
         })
      ).partition_id

      const jobImages = await prisma.job_image.findMany({
         where: { partition_id: partitionId }
      })

      const imageIds = jobImages.map((jobImage) => jobImage.image_id)
      const imageUris = jobImages.map((jobImage) => jobImage.image_uri)

      const jobLabelsRecords = await prisma.job_label.findMany({
         where: { job_id: Number(job_id) }
      })

      const jobLabels = jobLabelsRecords.map(
         (jobLabelRecord) => jobLabelRecord.label
      )

      return {
         title: jobTitle,
         labels: jobLabels,
         imageIds: imageIds,
         images: imageUris
      }
   }
}

module.exports = queries
