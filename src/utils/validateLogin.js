const { OAuth2Client } = require('google-auth-library')

const config = require('../config')

const validateGoogleLogin = token => new Promise((resolve, reject) => {
  if (!token) {
    resolve({
      code: 401,
      data: {
        msg: 'token is missing'
      }
    })
  }

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

    resolve({ data: userDetails })
  }

  verify().catch(err => {
    console.error('oops', typeof err)
    resolve({ code: 400, data: err })
  })
})

module.exports = {
  validateGoogleLogin
}
