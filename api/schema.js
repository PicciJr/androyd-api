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

  type BacktestingResult {
    highlights: [String] # conclusiones computadas en base a los resultados
    # TODO: necesitará el resto de campos: rentabilidad, hit rate, esp. matemática, etc
  }

  type Stock {
    id: ID
    tickerSymbol: String!
    hasActiveOperation: Boolean
    currentPerformance: Float
    currentPrice: Float
    daysActive: Int
    weeksActive: Float
    currentStopLoss: Float
    journalNotes: [StockNote]
    historicalData: [String]
    operationsList: [Operation]
    isOnWatchlist: Boolean
    isStockToAvoid: Boolean
  }

  type Query {
    stock(tickerSymbol: String!): Stock
    backtestingResults(startDate: String!, endDate: String!): BacktestingResult
    screenerResults: [Stock]
  }

  type Mutation {
    newOperation(input: NewOperation): Operation
    closeOperation(id: ID!): Operation
    addStockToWatchlist(tickerSymbol: String): Stock
    removeStockFromWatchlist(tickerSymbol: String): Stock
  }
`
module.exports = typeDefs
