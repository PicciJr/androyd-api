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
    createdAt: String
    endDate: String
    operationStatus: String
    operationActiveDays: Int
    operationPerformance: Float
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

  type StockNote {
    isSuccessNote: Boolean
    noteDate: String
    noteText: String
  }

  type Stock {
    id: ID!
    tickerSymbol: String!
    currentPerformance: Float
    daysActive: Int
    weeksActive: Float
    currentStopLoss: Float
    journalNotes: [StockNote]
    historicalData: [String]
    operationsList: [Operation]
  }

  type Query {
    stock(tickerSymbol: String!): Stock
  }

  type Mutation {
    newOperation(input: NewOperation): Operation
    closeOperation(id: ID!): Operation
  }
`
module.exports = typeDefs
