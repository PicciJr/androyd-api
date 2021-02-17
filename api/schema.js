const { gql } = require('apollo-server')

const typeDefs = gql`
  type Operation {
    id: ID!
    tickerSymbol: String!
    hasStockFlagMessage: Boolean
    initialPositionSize: Float
    entryPrice: Float
    stopLossDistance: Float
    technicalPattern: String
    technicalPatternDuration: Float
    tags: [String]
  }

  input NewOperation {
    tickerSymbol: String!
    hasStockFlagMessage: Boolean
    initialPositionSize: Float
    entryPrice: Float
    stopLossDistance: Float
    technicalPattern: String
    technicalPatternDuration: Float
    tags: [String]
  }

  type Stock {
    id: ID!
    tickerSymbol: String!
    currentPerformance: Float
    daysActive: Int
    weeksActive: Float
    currentStopLoss: Float
    journalNotes: [String]
    historicalData: [String]
    operationsList: [Operation]
  }

  type Query {
    getOperations(tickerSymbol: String!): [Operation]
  }

  type Mutation {
    newOperation(input: NewOperation): Operation
  }
`
module.exports = typeDefs
