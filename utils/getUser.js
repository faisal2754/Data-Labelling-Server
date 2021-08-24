const jwt = require('jsonwebtoken')
const prisma = require('../prisma/client')

const getUser = async (authHeader) => {
   const bearerLength = 'Bearer '.length
   if (authHeader && authHeader.length > bearerLength) {
      const token = authHeader.slice(bearerLength)

      const { result } = await new Promise((resolve) => {
         jwt.verify(token, process.env.JWT_SECRET, (err, result) => {
            if (err) {
               resolve({
                  result: null
               })
            } else {
               resolve({
                  result: result
               })
            }
         })
      })

      if (result) {
         const user = await prisma.user.findUnique({
            where: {
               user_id: result.user_id
            }
         })

         return user
      }

      return null
   }

   return null
}

module.exports = { getUser }
