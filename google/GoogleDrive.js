const { google } = require('googleapis')

class GoogleDrive {
   constructor() {
      // getting credentials.json
      const bufferCreds = process.env.GOOGLE_CREDS
      if (!bufferCreds) return console.log('Error loading client secret file.')

      const credentials = JSON.parse(bufferCreds)
      const { client_secret, client_id, redirect_uris } = credentials.installed

      const oAuth2Client = new google.auth.OAuth2(
         client_id,
         client_secret,
         redirect_uris[0]
      )

      // getting token
      const token = process.env.GOOGLE_TOKEN
      if (!token) return console.log('No token bruh')
      oAuth2Client.setCredentials(JSON.parse(token))

      //setting global variables
      const auth = oAuth2Client
      this.drive = google.drive({ version: 'v3', auth })
   }

   // createFolder() {
   //    var fileMetadata = {
   //       name: 'Data-Labelling',
   //       mimeType: 'application/vnd.google-apps.folder'
   //    }
   //    return this.drive.files.create({
   //       resource: fileMetadata,
   //       fields: 'id'
   //    })
   // }

   // deleteFiles(imgUrls) {
   //    const promises = []
   //    for (let i = 0; i < imgUrls.length; i++) {
   //       const imgId = imgUrls[i].substring(imgUrls[i].indexOf('=') + 1)
   //       promises.push(
   //          new Promise((resolve, reject) => {
   //             this.drive.files.delete({ fileId: imgId })
   //             resolve(200)
   //          })
   //       )
   //    }
   //    return Promise.all(promises)
   // }

   // uploadFile(file, path) {
   //    const fileMetadata = {
   //       name: file,
   //       parents: ['165e-zApP58GI_zJHr2wDzSbxIFet29kk']
   //    }
   //    const media = {
   //       mimeType: 'image/jpeg',
   //       body: fs.createReadStream(path + file)
   //    }
   //    const promise = this.drive.files.create({
   //       resource: fileMetadata,
   //       media: media,
   //       fields: 'id, name'
   //    })

   //    return promise
   // }

   // uploadStream(name, stream) {
   //    const fileMetadata = {
   //       name: name,
   //       parents: ['165e-zApP58GI_zJHr2wDzSbxIFet29kk']
   //    }
   //    const media = {
   //       mimeType: 'image/jpeg',
   //       body: stream
   //    }
   //    const promise = this.drive.files.create({
   //       resource: fileMetadata,
   //       media: media,
   //       fields: 'id, name'
   //    })

   //    return promise
   // }

   async uploadStreams(names, streams) {
      const promises = []
      for (let i = 0; i < names.length; i++) {
         const fileMetadata = {
            name: names[i],
            parents: ['165e-zApP58GI_zJHr2wDzSbxIFet29kk']
         }
         const media = {
            mimeType: 'image/jpeg',
            body: streams[i]
         }
         promises.push(
            this.drive.files.create({
               resource: fileMetadata,
               media: media,
               fields: 'id, name'
            })
         )
      }
      const response = await Promise.all(promises)

      return response.map((res) => res.data.id)
   }

   // uploadFiles(files, path) {
   //    const promises = []
   //    for (let i = 0; i < files.length; i++) {
   //       const fileMetadata = {
   //          name: files[i],
   //          parents: ['165e-zApP58GI_zJHr2wDzSbxIFet29kk']
   //       }
   //       const media = {
   //          mimeType: 'image/jpeg',
   //          body: fs.createReadStream(path + files[i])
   //       }
   //       promises.push(
   //          this.drive.files.create({
   //             resource: fileMetadata,
   //             media: media,
   //             fields: 'id, name'
   //          })
   //       )
   //    }
   //    return Promise.all(promises)
   // }

   // downloadFile(fileId) {
   //    const dest = fs.createWriteStream('photo.jpg')

   //    this.drive.files
   //       .get({ fileId, alt: 'media' }, { responseType: 'stream' })
   //       .then((res) => {
   //          res.data
   //             .on('end', () => {
   //                console.log('Done downloading file.')
   //             })
   //             .on('error', (err) => {
   //                console.error('Error downloading file.')
   //             })
   //             .pipe(dest)
   //       })
   // }
}

module.exports = GoogleDrive
