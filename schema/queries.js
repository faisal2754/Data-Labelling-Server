const prisma = require('../prisma/client')

const queries = {
   bruh: () => 'bruh',

   me: async (_, __, { user }) => {
      return user
   },

   viewJobs: async (_, __, { user }) => {
      const job_owner_id = user?.user_id

      const jobs = job_owner_id
         ? await prisma.job.findMany({
              where: {
                 AND: [
                    {
                       NOT: {
                          job_owner_id: job_owner_id
                       }
                    },
                    {
                       status: 'active'
                    }
                 ]
              }
           })
         : await prisma.job.findMany({
              where: {
                 status: 'active'
              }
           })

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
      //const userId = 38
      const userId = user.user_id

      const jobTitle = (
         await prisma.job.findFirst({
            where: { job_id: Number(job_id) }
         })
      ).title

      const partitionId = (
         await prisma.job_labeller.findFirst({
            where: {
               AND: [{ job_id: Number(job_id) }, { user_id: userId }]
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
         partition_id: partitionId,
         title: jobTitle,
         labels: jobLabels,
         image_ids: imageIds,
         images: imageUris
      }
   },

   labelJobState: async (_, { partition_id }, { user }) => {
      const jobLabellerId = user.user_id
      // const jobLabellerId = 38

      const imageIdArr = await prisma.job_image.findMany({
         where: { partition_id: Number(partition_id) },
         select: { image_id: true }
      })

      let imageIds = imageIdArr.map((imgId) => imgId.image_id)
      let removeImageIds = []

      const imgIdsLength = imageIds.length

      let labels = []
      for (let i = 0; i < imgIdsLength; i++) {
         const imgId = imageIds[i]
         const labelRecord = await prisma.image_label.findFirst({
            where: {
               user_id: jobLabellerId,
               image_id: imgId
            }
         })

         if (labelRecord) {
            labels.push(labelRecord.label)
         } else {
            removeImageIds.push(imgId)
         }
      }

      for (let j = 0; j < removeImageIds.length; j++) {
         const imgId = removeImageIds[j]
         imageIds = imageIds.filter((id) => id !== imgId)
      }

      return { image_ids: imageIds, labels }
   },

   ownedJobs: async (_, __, { user }) => {
      const userId = user.user_id

      const jobs = await prisma.job.findMany({
         where: {
            AND: [
               {
                  job_owner_id: userId
               },
               {
                  status: 'active'
               }
            ]
         }
      })

      const jobsWithImages = jobs.map(async (job) => {
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

   acceptedJobs: async (_, __, { user }) => {
      const userId = user.user_id

      const acceptedJobRecords = await prisma.job_labeller.findMany({
         where: {
            AND: [{ user_id: userId }, { is_complete: false }]
         },
         distinct: ['job_id'],
         select: {
            job_id: true
         }
      })

      const acceptedJobIds = acceptedJobRecords.map((record) => record.job_id)

      const acceptedJobs = await prisma.job.findMany({
         where: {
            job_id: {
               in: acceptedJobIds
            }
         }
      })

      const jobsWithImages = acceptedJobs.map(async (job) => {
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

   deletedJobs: async (_, __, { user }) => {
      const userId = user.user_id

      const userJobs = await prisma.job_labeller.findMany({
         where: {
            user_id: userId
         },
         select: {
            job_id: true
         }
      })

      const userJobIds = userJobs.map((job) => job.job_id)

      const deletedJobs = await prisma.job.findMany({
         where: {
            AND: [
               {
                  job_id: {
                     in: userJobIds
                  }
               },
               { status: 'deleted' }
            ]
         }
      })

      const deletedJobIds = deletedJobs.map((job) => job.job_id)

      const { balance } = await prisma.user.findFirst({
         where: {
            user_id: userId
         }
      })

      await prisma.user.update({
         where: {
            user_id: userId
         },
         data: {
            balance: balance + 5 * deletedJobIds.length
         }
      })

      await prisma.job_labeller.deleteMany({
         where: {
            job_id: {
               in: deletedJobIds
            }
         }
      })

      return deletedJobs
   },

   completedJobs: async (_, __, { user }) => {
      const userId = user.user_id

      const jobs = await prisma.job.findMany({
         where: {
            job_owner_id: userId
         }
      })

      const job_ids = jobs.map((job) => job.job_id)
      let completedJobs = []

      for (let job_id of job_ids) {
         const partitions = await prisma.job_partition.findMany({
            where: {
               job_id
            }
         })

         let isComplete = true

         for (let partition of partitions) {
            if (!partition.is_complete) {
               isComplete = false
               break
            }
         }

         if (isComplete) {
            completedJobs.push(job_id)
         }
      }

      return await prisma.job.findMany({
         where: {
            job_id: {
               in: completedJobs
            }
         }
      })
   }
}

module.exports = queries
