require('dotenv').config()
process.env.NODE_ENV = process.env.NODE_ENV || 'development'

const env = process.env.NODE_ENV
const pass = escape(process.env.MONGO_PASS) // hay que hacer un escape de la password
const user = process.env.MONGO_USER
const cluster = process.env.MONGO_CLUSTER_SANDBOX
const db_name = 'androyd-db'

const baseConfig = {
  port: 3000,
  secrets: {},
  db: {
    url: `mongodb+srv://${user}:${pass}@${cluster}.mongodb.net/${db_name}?retryWrites=true&w=majority&useNewUrlParser=true&useUnifiedTopology=true`,
  },
  finhubApi: {
    url: 'https://finnhub.io/api/v1',
    api_key: process.env.FINHUB_API_KEY,
  },
  fmpApi: {
    url: 'https://financialmodelingprep.com/api/v3',
    api_key: process.env.FMP_API_KEY,
  },
  finviz: {
    url: 'https://finviz.com/',
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
