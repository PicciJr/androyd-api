const mongoose = require('mongoose')

/**
 * Lo que se almacena en BBDD de un stock.
 * No todo será necesario de almancenar ya que hay datos que obtendré con resolvers de Graphql gracias al uso de APIs financieras.
 */

const stockSchema = new mongoose.Schema(
  {
    tickerSymbol: {
      type: String,
    },
    currentPerformance: {
      type: Number,
    },
    daysActive: {
      type: Number,
    },
    weeksActive: {
      type: Number,
    },
    currentStopLoss: {
      type: Number,
    },
    journalNotes: {
      type: Array,
    },
    historicalData: {
      type: Array,
    },
    isOnWatchlist: {
      type: Boolean,
    },
    isStockToAvoid: {
      type: Boolean,
    },
  },
  { timestamps: true }
)

const stocksCollection = 'stocks'

const Stock = mongoose.model(stocksCollection, stockSchema)

module.exports = Stock
