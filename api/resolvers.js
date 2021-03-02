const Operation = require('./models/operation.model')
const Stock = require('./models/stock.model')

module.exports = {
  Query: {
    async stock(_, { tickerSymbol }, ___, ____) {
      console.log('getStockData', tickerSymbol)
      const stock = await Stock.findOne({ tickerSymbol: tickerSymbol }).exec()
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
  },
  Mutation: {
    async newOperation(_, { input }, ___, ____) {
      console.log('newOperation')
      const newOperation = await Operation.create(input)
    },
    async closeOperation(_, { id }, ___, ____) {
      console.log('closeOperation', id)
      const end_date = new Date().toString()
      const operation = await Operation.findByIdAndUpdate(id, {
        endDate: end_date,
      })
      return operation
    },
  },
  Stock: {
    operationsList(stock, _, __) {
      console.log('operationsList')
      return Operation.find({ tickerSymbol: stock.tickerSymbol }).exec()
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
