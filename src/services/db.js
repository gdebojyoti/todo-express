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
      this.todos = database.collection('todos')

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

  // fetch authorized user (one that matches both email & token)
  async getAuthorizedUser (email, token) {
    if (!email || !token) {
      return null
    }

    const user = await this.users.findOne({ email, token })
    return user
  }

  async addUser (details) {
    const added = await this.users.insertOne(details)
    return added
  }

  // fetch list of all todos for given user
  async fetchTodos (userId) {
    const data = await this.todos.findOne({ userId })
    return data
  }

  async saveTodos (data) {
    try {
      await this.todos.updateOne({ userId: data.userId }, { $set: data }, { upsert: true })
      return true
    } catch (e) {
      console.log('Could not update DB', e)
      return false
    }
  }
}

module.exports = DatabaseService
