const argon2 = require('argon2')
const jwt = require('jsonwebtoken')
const fs = require('fs')
const { Parser } = require('json2csv')
const GoogleDrive = require('../google/GoogleDrive')
const prisma = require('../prisma/client')

const gDrive = new GoogleDrive()

const mutations = {
   register: async (_, { username, email, password }, { res }) => {
      const hashedPass = await argon2.hash(password)
      const user = await prisma.user.create({
         data: {
            username: username,
            email: email,
            password: hashedPass
         }
      })

      if (!user) throw new Error('Registration failed :`(')

      user.jwt = jwt.sign({ user_id: user.user_id }, process.env.JWT_SECRET)

      res.cookie('jwt', user.jwt, {
         httpOnly: true,
         sameSite: 'None',
         secure: true
      })

      return user
   },

   login: async (_, { email, password }, { res }) => {
      const user = await prisma.user.findUnique({
         where: {
            email: email
         }
      })

      if (!user) throw new Error('Email not found')

      if (!(await argon2.verify(user.password, password))) {
         throw new Error('Password incorrect')
      }

      user.jwt = jwt.sign({ user_id: user.user_id }, process.env.JWT_SECRET)

      res.cookie('jwt', user.jwt, {
         httpOnly: true,
         sameSite: 'None',
         secure: true
      })

      return user
   },

   editProfile: async (_, { username, password, avatar }, { user }) => {
      const user_id = user.user_id

      let hashedPass

      if (!username) {
         username = user.username
      }
      if (!password) {
         hashedPassword = user.password
      }
      if (!avatar) {
         avatar = user.avatar
      }

      if (password) {
         hashedPass = await argon2.hash(password)
      }

      const updatedUser = await prisma.user.update({
         where: { user_id },
         data: {
            username: username,
            password: hashedPass,
            avatar: avatar
         }
      })

      if (!updatedUser) throw new Error('Error updating user')

      return updatedUser
   },

   createJob: async (
      _,
      { title, description, credits, labels, num_partitions, files },
      { user }
   ) => {
      const totalCost = Number(credits) * Number(num_partitions)
      if (user.balance < totalCost) {
         throw new Error('Insufficient funds.')
      }

      // Job metadata
      const job_owner_id = user.user_id
      const numLabels = labels.length
      const maxNumLabellers =
         numLabels % 2 === 0 ? numLabels + 1 : numLabels + 2

      const creditsPerLabeller = Math.floor(Number(credits) / maxNumLabellers)

      if (creditsPerLabeller <= 0) {
         throw new Error('Not enough credits per labeller!')
      }

      const job = await prisma.job.create({
         data: {
            title,
            description,
            credits: creditsPerLabeller,
            job_owner_id,
            labellers_per_partition: maxNumLabellers
         }
      })

      if (!job) throw new Error('Error creating job.')

      // Job labels
      labels.forEach(async (label) => {
         await prisma.job_label.create({
            data: {
               job_id: job.job_id,
               label: label
            }
         })
      })

      // Partition creation
      const encodedFiles = await Promise.all(files)
      const numImages = encodedFiles.length

      let partitionInfo = {
         splitArr: [],
         ids: []
      }

      const partitionSize = Math.floor(numImages / num_partitions)

      for (let i = 0; i < num_partitions - 1; i++) {
         partitionInfo.splitArr.push(
            encodedFiles.slice(i * partitionSize, (i + 1) * partitionSize)
               .length
         )

         partitionInfo.ids.push(
            (
               await prisma.job_partition.create({
                  data: {
                     job_id: job.job_id,
                     partition_number: i
                  }
               })
            ).partition_id
         )
      }

      partitionInfo.splitArr.push(
         encodedFiles.slice((num_partitions - 1) * partitionSize).length
      )

      partitionInfo.ids.push(
         (
            await prisma.job_partition.create({
               data: {
                  job_id: job.job_id,
                  partition_number: num_partitions - 1
               }
            })
         ).partition_id
      )

      // Job images
      let filenames = []
      let streams = []

      for (let i = 0; i < numImages; i++) {
         const { createReadStream, filename } = await encodedFiles[i]

         filenames.push(filename)
         var stream = createReadStream()
         streams.push(stream)
      }

      const imgIds = await gDrive.uploadStreams(filenames, streams)

      const urls = imgIds.map(
         (imgId) => `https://drive.google.com/uc?id=${imgId}`
      )

      // Image table population
      let startIdx = 0
      for (let i = 0; i < partitionInfo.splitArr.length; i++) {
         for (let j = 0; j < partitionInfo.splitArr[i]; j++) {
            await prisma.job_image.create({
               data: {
                  image_uri: urls[j + startIdx],
                  partition_id: partitionInfo.ids[i]
               }
            })
         }

         startIdx = partitionInfo.splitArr[i]
      }

      await prisma.user.update({
         where: {
            user_id: user.user_id
         },
         data: {
            balance: user.balance - totalCost
         }
      })

      return job
   },

   acceptJob: async (_, { job_id }, { user }) => {
      const currentUserId = user.user_id

      // Find first available partition
      const partition = await prisma.job_partition.findFirst({
         where: {
            AND: [
               {
                  job_id: Number(job_id)
               },
               {
                  is_full: false
               }
            ]
         }
      })

      if (!partition) return false

      // Find number of labels assigned to job
      const numLabels = await prisma.job_label.count({
         where: {
            job_id: Number(job_id)
         }
      })

      // Maximum number of people per partition
      const maxNumLabellers =
         numLabels % 2 === 0 ? numLabels + 1 : numLabels + 2

      const numLabellersAssigned = await prisma.job_labeller.count({
         where: {
            partition_id: partition.partition_id
         }
      })

      if (numLabellersAssigned === maxNumLabellers - 1) {
         await prisma.job_partition.update({
            where: {
               partition_id: partition.partition_id
            },
            data: {
               is_full: true
            }
         })
      }

      const newLabeller = await prisma.job_labeller.create({
         data: {
            job_id: Number(job_id),
            user_id: currentUserId,
            partition_id: partition.partition_id
         }
      })

      if (!newLabeller) return false

      return true
   },

   saveState: async (
      _,
      { image_ids, labels, partition_id, is_complete = false },
      { user }
   ) => {
      const userId = user.user_id
      for (let i = 0; i < image_ids.length; i++) {
         const image_id = Number(image_ids[i])
         const label = labels[i]

         await prisma.image_label.upsert({
            create: {
               user_id: userId,
               image_id,
               label
            },
            update: { label },
            where: {
               user_id_image_id: { user_id: userId, image_id }
            }
         })
      }

      if (is_complete) {
         const complete_counter = (
            await prisma.job_partition.findFirst({
               where: { partition_id: Number(partition_id) }
            })
         ).complete_counter

         await prisma.job_partition.update({
            where: { partition_id: Number(partition_id) },
            data: {
               complete_counter: Number(complete_counter) + 1
            }
         })

         const job_id = (
            await prisma.job_partition.findFirst({
               where: { partition_id: Number(partition_id) }
            })
         ).job_id

         const magic_number = (
            await prisma.job.findFirst({
               where: { job_id: Number(job_id) }
            })
         ).labellers_per_partition

         await prisma.job_labeller.update({
            where: {
               job_id_user_id_partition_id: {
                  job_id: Number(job_id),
                  user_id: userId,
                  partition_id: Number(partition_id)
               }
               // AND: [
               //    { job_id: Number(job_id) },
               //    { partition_id: Number(partition_id) },
               //    { user_id: userId }
               // ]
            },
            data: {
               is_complete: true
            }
         })

         const credits = (
            await prisma.job.findFirst({
               where: { job_id: Number(job_id) }
            })
         ).credits

         await prisma.user.update({
            where: {
               user_id: userId
            },
            data: {
               balance: user.balance + credits
            }
         })

         // await prisma.job_labeller.update({
         //    where: {
         //       job_id_user_id_partition_id: {
         //          job_id: Number(job_id),
         //          user_id: userId,
         //          partition_id: Number(partition_id)
         //       }
         //       // AND: [{ user_id: userId }, { job_id: Number(job_id) }]
         //    },
         //    data: {
         //       is_complete: true
         //    }
         // })

         if (complete_counter + 1 === magic_number) {
            await prisma.job_partition.update({
               where: { partition_id: Number(partition_id) },
               data: { is_complete: true }
            })
         }
      }

      return true
   },

   deleteJob: async (_, { job_id }, { user }) => {
      if (!user) {
         return false
      }

      const users = await prisma.job_labeller.findMany({
         where: {
            job_id: Number(job_id)
         },
         select: {
            user_id: true
         }
      })

      const userIdArr = users.map((id) => id.user_id)
      const userIds = [...new Set(userIdArr)]

      userIds.forEach(async (id) => {
         await prisma.deleted_jobs.create({
            data: {
               user_id: id,
               job_id: Number(job_id)
            }
         })
      })

      const partitions = await prisma.job_partition.findMany({
         where: {
            job_id: Number(job_id)
         },
         select: {
            partition_id: true
         }
      })

      const partitionIds = partitions.map((partition) => partition.partition_id)

      const images = await prisma.job_image.findMany({
         where: {
            partition_id: {
               in: partitionIds
            }
         },
         select: {
            image_id: true
         }
      })

      const imageIds = images.map((image) => image.image_id)

      await prisma.job.update({
         where: {
            job_id: Number(job_id)
         },
         data: {
            status: 'deleted'
         }
      })

      await prisma.image_label.deleteMany({
         where: {
            image_id: {
               in: imageIds
            }
         }
      })

      await prisma.job_image.deleteMany({
         where: {
            partition_id: {
               in: partitionIds
            }
         }
      })

      await prisma.job_labeller.deleteMany({
         where: {
            job_id: Number(job_id)
         }
      })

      await prisma.job_partition.deleteMany({
         where: {
            job_id: Number(job_id)
         }
      })

      await prisma.job_label.deleteMany({
         where: {
            job_id: Number(job_id)
         }
      })

      return true
   },

   jobResults: async (_, { job_id }, { user }) => {
      const userId = user.user_id
      const jobId = Number(job_id)

      const resultJob = await prisma.job.findFirst({
         where: {
            job_id: jobId
         },
         select: {
            job_owner_id: true,
            results: true
         }
      })

      if (userId !== resultJob.job_owner_id)
         throw new Error("You don't own this job.")

      if (resultJob.results) {
         return resultJob.results
      }

      const jobsInfo = await prisma.job.findFirst({
         where: {
            job_id: jobId
         },
         include: {
            job_partition: {
               include: {
                  job_image: {
                     include: {
                        image_label: true
                     }
                  }
               }
            }
         }
      })

      let imageInfo = []
      for (let partition of jobsInfo.job_partition) {
         for (let image of partition.job_image) {
            imageInfo.push(image)
         }
      }

      let result = []

      for (let info of imageInfo) {
         const allImageLabels = info.image_label.map(
            (labelInfo) => labelInfo.label
         )

         let uniqueLabels = [...new Set(allImageLabels)]
         let labelCounts = {}
         for (let label of uniqueLabels) {
            labelCounts[label] = 0
         }
         for (let imgLabel of allImageLabels) {
            labelCounts[imgLabel] += 1
         }
         let values = Object.values(labelCounts)
         let mode = values.indexOf(Math.max(...values))

         let confidence =
            Math.round((Math.max(...values) / allImageLabels.length) * 10000) /
            100

         let row = {
            image_url: info.image_uri,
            mode_label: uniqueLabels[mode],
            confidence: `${confidence}%`
         }

         for (let i = 0; i < allImageLabels.length; i++) {
            const label = allImageLabels[i]
            row[`labeller${i}`] = label
         }

         result.push(row)
      }

      const fields = Object.keys(result[0])

      const csv = new Parser({ fields })

      fs.writeFile('data.csv', csv.parse(result), (err) => {
         if (err) console.log(err)
         else console.log('File saved')
      })

      const link = await gDrive.uploadCSV()

      await prisma.job.update({
         where: {
            job_id: jobId
         },
         data: {
            results: link
         }
      })

      return link
   }
}

module.exports = mutations
