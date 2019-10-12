const crypto = require('crypto')

const generateHash = (email) => {
  const random = Math.ceil(Math.random() * 999999999)
  const random2 = Math.ceil(Math.random() * 7) + 4
  return (
    crypto.createHash('sha256').update(email + (new Date()).getTime()).digest('hex') + crypto.createHash('sha256').update('' + random).digest('hex')
  ).substring(random2)
}

module.exports = generateHash
