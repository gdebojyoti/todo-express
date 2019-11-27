const DatabaseService = new (require('./services/db'))()
const { validateGoogleLogin } = require('./utils/validateLogin')
const generateHash = require('./utils/generateHash')

const appRouter = function (app) {
  app.use('/postGoogleLogin', (req, res) => {
    const { token: googleAuthToken } = req.body || {}

    // verify validity of client's Google auth token
    validateGoogleLogin(googleAuthToken).then(async ({ code = 200, data }) => {
      // if Google auth token is valid
      if (data && code === 200) {
        // check for user with email in DB
        const user = await DatabaseService.getUser(data.email)
        if (!user) {
          // create new user
          const { email, name, fname, lname, image } = data
          const token = generateHash(email)
          const userDetails = {
            id: (new Date()).getTime(),
            token,
            email,
            name,
            fname,
            lname,
            image,
            googleAuthToken
          }
          // add new entry in DB
          await DatabaseService.addUser(userDetails)
        }

        // set generated / retrieved 'token' as cookie in client
        res.cookie('token', user.token, {
          httpOnly: true,
          // secure: true, // @TODO: enable after adding https
          maxAge: 1000 * 60 * 60 * 24 // 24 hour
        })
        res.send({ success: true, msg: `user ${user ? 'found' : 'added'}` })
      } else {
        // if invalid (or any other error occurs), show error to client
        res.status(code).send(data)
      }
    })
  })

  app.use('/syncTodos', async (req, res) => {
    const { token } = req.cookies || {}
    const { todos, email } = req.body || {}
    const cArr = todos || []

    if (!token) {
      res.status(403).send({ msg: 'token is missing' })
      return
    }

    // check if user is authorized
    const user = await DatabaseService.getAuthorizedUser(email, token)
    if (!user) {
      res.status(403).send({ msg: 'unauthorized user' })
      return
    }

    // fetch array of todos from server (sArr)
    const data = await DatabaseService.fetchTodos(user.id)
    const sArr = data ? data.todos : []

    // compare cArr with sArr; generate new list of todos nArr
    cArr.forEach(todo => {
      // compare client todo
      // @TODO: check for invalid todo item
      if (!todo || typeof todo !== 'object') {
        return
      }
      if (!todo.id) {
        return
      }

      const index = sArr.findIndex(item => item.id === todo.id)
      // if todo is new, push it to server todo array
      if (index === -1) {
        sArr.push({ ...todo, isSynced: true })
        return
      }

      let itemInServer = sArr[index]

      // ignore if item on server is already deleted
      if (itemInServer.isDeleted) {
        return
      }

      // if todo has just been deleted, delete entire server item except id & isDeleted
      if (todo.isDeleted) {
        itemInServer = {
          id: todo.id,
          isDeleted: true
        }
      }

      // if client todo is more recent, replace server todo with it
      if (!itemInServer.lastUpdated || todo.lastUpdated > itemInServer.lastUpdated) {
        itemInServer = { ...todo, isSynced: true }
      }

      // update server item details in server todos array
      sArr[index] = itemInServer
    })

    const updatedData = {
      ...data,
      userId: user.id,
      todos: sArr
    }

    // save updatedData to DB
    const saved = await DatabaseService.saveTodos(updatedData)
    if (!saved) {
      res.status(400).send({ msg: 'data sync failed' })
      return
    }

    // send it to client
    res.send({ success: true, todos: sArr })
  })

  app.use('/', (req, res) => {
    res.send('Nothing to see here...')
  })
}

module.exports = appRouter
