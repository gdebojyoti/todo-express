const mongo = require('mongodb').MongoClient

const config = require('../config')

class DatabaseService {
  constructor () {
    this.users = null

    this.connectToDb()
  }

  connectToDb () {
    mongo.connect(config.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }, async (err, client) => {
      if (err) {
        console.error('Mongo connection failed', err)
        return
      }

      const database = client.db('thetodoapp')
      this.users = database.collection('users')

      // const isExistingUser = await this.isExistingUser('djhf')
      // console.log(isExistingUser)
    })
  }

  async isExistingUser (email) {
    if (!email) {
      return false
    }

    const userCount = await this.users.countDocuments({ email })

    return !!userCount
  }

  async getUser (email) {
    if (!email) {
      return null
    }

    const user = await this.users.findOne({ email })
    return user
  }

  async addUser (details) {
    const added = await this.users.insertOne(details)
    return added
  }
}

module.exports = DatabaseService
