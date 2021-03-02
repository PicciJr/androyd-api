const mongoose = require('mongoose')

/**
 * Lo que se almacena en BBDD de una operación.
 * No todo será necesario de almancenar ya que hay datos que obtendré con resolvers de Graphql gracias al uso de APIs financieras.
 */

const operationSchema = new mongoose.Schema(
  {
    tickerSymbol: {
      type: String,
    },
    hasStockFlagMessage: {
      type: Boolean,
    },
    initialPositionSize: {
      type: Number,
    },
    entryPrice: {
      type: Number,
    },
    stopLossDistance: {
      type: Number,
    },
    technicalPattern: {
      type: String,
    },
    technicalPatternDuration: {
      type: Number,
    },
    tags: {
      type: Array,
    },
    endDate: {
      type: Date
    }
  },
  { timestamps: true }
)

const operationsCollection = 'operations'

const Operation = mongoose.model(operationsCollection, operationSchema)

module.exports = Operation
