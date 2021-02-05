require('dotenv').config()
process.env.NODE_ENV = process.env.NODE_ENV || 'development'

const env = process.env.NODE_ENV
const pass = escape(process.env.MONGO_PASS) // hay que hacer un escape de la password
const user = process.env.MONGO_USER
const cluster = process.env.MONGO_CLUSTER_SANDBOX

const baseConfig = {
  port: 3000,
  secrets: {},
  db: {
    url: `mongodb+srv://${user}:${pass}@${cluster}.mongodb.net/test?retryWrites=true&w=majority&useNewUrlParser=true&useUnifiedTopology=true`,
  },
}

let envConfig = {}

// TODO: definir entornos
switch (
  env
  //   case 'development':
  //   case 'dev':
  //     envConfig = require('./dev').config
  //     break
  //   case 'test':
  //   case 'testing':
  //     envConfig = require('./testing').config
  //     break
  //   case 'prod':
  //   case 'production':
  //     envConfig = require('./prod').config
  //   default:
  //     envConfig = require('./dev').config
) {
}

module.exports = baseConfig
