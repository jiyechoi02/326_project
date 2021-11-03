const dotenv = require('dotenv')
const mongoose = require('mongoose')

dotenv.config()
const url = process.env.MONGO_URL

mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })

module.exports = mongoose;
  












