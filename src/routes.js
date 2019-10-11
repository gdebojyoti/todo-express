const config = require('./config')

const appRouter = function (app) {
  app.use('/validateGoogleToken', (req, res) => {
    const { token } = req.body || {}

    if (!token) {
      res.status(401).send({
        msg: 'token is missing'
      })
    }

    const { OAuth2Client } = require('google-auth-library')
    const client = new OAuth2Client(config.GOOGLE_CLIENT_ID)
    async function verify () {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: config.GOOGLE_CLIENT_ID // [CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
      })
      const payload = ticket.getPayload()

      const userDetails = {
        googleid: payload.sub,
        email: payload.email,
        image: payload.picture,
        name: payload.name,
        fname: payload.given_name,
        lname: payload.family_name,
        domain: payload.hd // request specified a G Suite domain
      }

      res.send(userDetails)
    }
    verify().catch(err => {
      console.error('oops', typeof err)
      res.status(400).send(err)
    })
  })

  app.use('/', (req, res) => {
    res.send('Nothing to see here...')
  })
}

module.exports = appRouter
