const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')

const config = require('./config')
const routes = require('./routes')

const app = express()

app.use(express.json()) // bodyparser - for parsing req.body

app.use(cookieParser()) // ability to read cookies

// app.use(express.static('public'))

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true)
    }
    if (config.ALLOWED_ORIGINS.indexOf(origin) === -1) {
      var msg = 'The CORS policy for this site does not allow access from the specified Origin.'
      return callback(new Error(msg), false)
    }
    return callback(null, true)
  },
  credentials: true
}))

routes(app)

app.listen(config.PORT, () => {
  console.log(`TTA service running on port ${config.PORT}`)
})
