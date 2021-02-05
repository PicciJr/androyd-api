const { MongoClient } = require('mongodb')
const mongoose = require('mongoose')
const baseConfig = require('./config')

const dbUrl = baseConfig.db.url

const client = new MongoClient(dbUrl)

async function run() {
  try {
    await client.connect()
    console.log('Connected correctly to Mongo Database')
  } catch (err) {
    console.log(err.stack)
  } finally {
    await client.close()
  }
}

run().catch(console.dir)

mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true })

const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function () {
  console.log('mongoose connected to Mongo')
})
