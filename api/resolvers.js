const Operation = require('./models/operation.model')

module.exports = {
  Query: {
    getOperations(_, { tickerSymbol }, ___, ____) {
      console.log('voy a buscar', tickerSymbol)
      return Operation.find({ tickerSymbol }).exec()
    },
  },
  Mutation: {
    async newOperation(_, { input }, ___, ____) {
      const newOperation = await Operation.create(input)
      console.log('nueva operacion creada', newOperation)
    },
  },
}
