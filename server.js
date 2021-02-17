const express = require('express')
const { MongoClient } = require('mongodb')
const mongoose = require('mongoose')
const baseConfig = require('./config')
const { graphqlHTTP } = require('express-graphql')
const { buildSchema } = require('graphql')
const { ApolloServer, gql } = require('apollo-server')
const resolvers = require('./api/resolvers')
const typeDefs = require('./api/schema')

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
  console.log('mongoose conectado a mongo')
})

const server = new ApolloServer({ typeDefs, resolvers })
server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`)
})
