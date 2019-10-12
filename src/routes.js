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
        if (user) {
          // if user found, return 'token' to client
          res.send({ msg: 'user found', token: user.token })
        } else {
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
          // send generated 'token' to client
          res.send({ msg: 'user added', token })
        }
      } else {
        // if invalid (or any other error occurs), show error to client
        res.status(code).send(data)
      }
    })
  })

  app.use('/', (req, res) => {
    res.send('Nothing to see here...')
  })
}

module.exports = appRouter
