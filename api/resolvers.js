const Operation = require('./models/operation.model')
const Stock = require('./models/stock.model')
const { finhubApi } = require('../services')
const { finhubApiKey } = require('../services')
const { getScreeningResults } = require('../services/finviz')

module.exports = {
  Query: {
    async stock(_, { tickerSymbol }, ___, ____) {
      console.log('stock', tickerSymbol)
      const stock = await Stock.findOne({ tickerSymbol: tickerSymbol }).exec()
      if (stock === null) {
        return {
          tickerSymbol,
          hasActiveOperation: false,
          currentPerformance: 0.0,
          daysActive: 0,
          weeksActive: 0,
          currentStopLoss: 0.0,
          journalNotes: [],
          historicalData: [],
          operationsList: [],
        }
      }
      return stock
    },
    async backtestingResults(_, { startDate, endDate }, __, ____) {
      console.log('backtestingResults')
      const startDateFormatted = new Date(startDate)
      const endDateFormatted = new Date(endDate)
      const operationsToAnalyze = await Operation.find({
        createdAt: { $gte: startDateFormatted },
        endDate: { $lte: endDateFormatted },
      })
      return operationsToAnalyze
    },
    screenerResults(_, __, ___, _____) {
      console.log('screenerResults')
      return getScreeningResults()
    },
  },
  Mutation: {
    async newOperation(_, { input }, ___, ____) {
      console.log('newOperation')
      try {
        const newOperation = await Operation.create(input)
        const stock = await Stock.find({
          tickerSymbol: newOperation.tickerSymbol,
        })
        // si el stock no existe en BBDD, añadirlo también
        if (stock.length <= 0)
          Stock.create({
            tickerSymbol: newOperation.tickerSymbol,
            currentPerformance: null,
            daysActive: null,
            weeksActive: null,
            currentStopLoss: null,
            journalNotes: [],
            historicalData: [],
          })
      } catch (err) {
        console.log('err', err)
      }
      return newOperation
    },
    async closeOperation(_, { id }, ___, ____) {
      console.log('closeOperation', id)
      const end_date = new Date().toString()
      const operation = await Operation.findByIdAndUpdate(id, {
        endDate: end_date,
      })
      return operation
    },
    async addStockToWatchlist(_, { tickerSymbol }, __, ____) {
      console.log('addStockToWatchlist', tickerSymbol)
      let stock = await Stock.findOne({ tickerSymbol: tickerSymbol }).exec()
      if (stock === null) {
        Stock.create({
          tickerSymbol: tickerSymbol,
          currentPerformance: null,
          daysActive: null,
          weeksActive: null,
          currentStopLoss: null,
          isOnWatchlist: true,
          journalNotes: [],
          historicalData: [],
        })
      } else
        stock = await Stock.findOneAndUpdate(
          { tickerSymbol: tickerSymbol },
          { isOnWatchlist: true }
        ).exec()
      return stock
    },
    async removeStockFromWatchlist(_, { tickerSymbol }, __, ____) {
      console.log('removeStockFromWatchlist', tickerSymbol)
      const stock = await Stock.findOneAndUpdate(
        { tickerSymbol: tickerSymbol },
        { isOnWatchlist: false }
      ).exec()
      return stock
    },
  },
  Stock: {
    operationsList(stock, _, __) {
      console.log('operationsList')
      return Operation.find({ tickerSymbol: stock.tickerSymbol }).exec()
    },
    async hasActiveOperation(stock, _, __) {
      console.log('hasActiveOperation')
      const operations = await Operation.find({
        tickerSymbol: stock.tickerSymbol,
      })
      const activeOperation = operations.find(
        (operation) => operation.endDate === null
      )
      if (operations.length <= 0) return false
      else if (typeof activeOperation !== 'undefined') return true
      return false
    },
    async currentPrice({ tickerSymbol }, _, __) {
      console.log('currentPrice', tickerSymbol)
      try {
        const response = await finhubApi.get(
          `/quote?symbol=${tickerSymbol.toUpperCase()}&token=${finhubApiKey}`
        )
        return response.data.c
      } catch (err) {
        console.log('error finhub', err)
      }
    },
  },
  Operation: {
    createdAt(operation, _, __) {
      console.log('createdAt')
      return operation.createdAt.toString()
    },
    operationStatus(operation, _, __) {
      console.log('operationStatus')
      const today = new Date()
      return operation.createdAt.getTime() <= today.getTime() &&
        typeof operation.endDate === 'undefined'
        ? 'In progress'
        : 'Closed'
    },
    operationActiveDays(operation, _, __) {
      console.log('operationActiveDays')
      const today = new Date()
      const time_difference = today.getTime() - operation.createdAt.getTime()
      const total_days = parseInt(time_difference / (1000 * 60 * 60 * 24))
      return total_days
    },
    operationPerformance(operation, _, __) {
      // TODO: calcular usando el API financiera
      return 80.5
    },
  },
  BacktestingResult: {
    highlights(operationsToAnalyze, _, __) {
      console.log(
        'voy a extraer las conclusiones de las siguientes operaciones',
        operationsToAnalyze
      )
      return ['conclusion 1']
      // TODO: computar un array de conclusiones en base a los datos de las operaciones que me llegan
    },
  },
}
