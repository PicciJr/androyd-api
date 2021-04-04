const baseConfig = require('../config')
const axios = require('axios')
const HTMLParser = require('node-html-parser')
const { getCompanyQuote, getCompanyProfile } = require('./fmp')
const Stock = require('../api/models/stock.model')

const finviz = axios.create({
  baseURL: baseConfig.finviz.url,
  timeout: 10000,
})

finviz.interceptors.request.use(
  function (config) {
    return config
  },
  function (error) {
    console.log('error interceptor', error)
    // Do something with request error
    return Promise.reject(error)
  }
)

const isOffHighsValid = (data) => {
  if (typeof data[0] !== 'undefined') {
    const { yearHigh = null, price = null, symbol = null } = data[0]
    if (yearHigh !== null && price !== null) {
      const offValidMeasure = 1 - 0.25 // 25% de distancia a maximos como mucho
      console.log(
        'isOffHighsValid',
        yearHigh * offValidMeasure <= price,
        symbol
      )
      return yearHigh * offValidMeasure <= price
    } else return true
  } else return true
}

const isValidMarketCap = (data) => {
  if (typeof data[0] !== 'undefined') {
    const { marketCap = null, symbol = null } = data[0]
    if (marketCap !== null) {
      const maxMarketCapAllowed = 40000000000 // 40B
      console.log('isValidMarketCap', marketCap <= maxMarketCapAllowed, symbol)
      return marketCap <= maxMarketCapAllowed
    } else return true
  } else return true
}

const isValidIpoDate = (data) => {
  if (typeof data[0] !== 'undefined') {
    const { ipoDate = null, symbol = null } = data[0]
    // le tengo que asignar un valor por defecto en el parametro
    // por si la llamada a la API no retorna un ipoDate, que para algunos valores pasa
    const maxIpoDateAllowed = 2015
    if (ipoDate !== null) {
      const year = ipoDate.split('-')[0]
      console.log('isValidIpoDate', parseInt(year) > maxIpoDateAllowed, symbol)
      return parseInt(year) > maxIpoDateAllowed
    } else return true
  } else return true
}

const getStockFromDatabase = async (symbol) => {
  const stock = await Stock.findOne({ tickerSymbol: symbol }).exec()
  return stock
}

const getWeeklyTopStocksFromFinviz = async (offset = null) => {
  let nonParsedHtml = null
  let root = null
  const batchOfElements = []

  // obtener los de la primera página
  if (offset === null) {
    nonParsedHtml = await finviz.get(
      '/screener.ashx?v=151&f=fa_salesqoq_o20,sh_price_o7,ta_perf_1w10o&ft=2&o=-high52w'
    )
    root = HTMLParser.parse(nonParsedHtml.data)
  } else {
    // obtengo los stocks de la siguiente pagina
    nonParsedHtml = await finviz.get(
      `/screener.ashx?v=151&f=fa_salesqoq_o20,sh_price_o7,ta_perf_1w10o&ft=2&o=-high52w&r=${offset}`
    )
    root = HTMLParser.parse(nonParsedHtml.data)
  }
  const stockSymbols = root.querySelectorAll('.screener-link-primary')

  stockSymbols.forEach((element) => {
    batchOfElements.push(element.text)
  })
  return batchOfElements
}

module.exports = {
  getScreeningResults: async () => {
    const symbolsToQuery = [] // array en el que se anidarán los elementos finales
    let batchOfElementsToScan = await getWeeklyTopStocksFromFinviz() // como son varias paginas, voy haciendo batchs de elementos para consultarlos
    let numberOfElementsPerPage = 0

    if (batchOfElementsToScan.length > 0)
      numberOfElementsPerPage = batchOfElementsToScan.length

    let maxCallsApiReached = 240
    let callsIndex = 0
    let batchIndex = 1 // no puede empezar en cero
    let pageOffset = 0
    let index = 0

    let symbol = null
    let symbolQuoteApiResponse = null
    let symbolProfileApiResponse = null
    let stockData = null
    let isStockAlreadyInWatchlist = null
    while (
      batchOfElementsToScan.length > 0 &&
      callsIndex <= maxCallsApiReached
    ) {
      console.log(
        'itero en bucle',
        callsIndex
      )
      try {
        batchIndex++
        symbol = batchOfElementsToScan[index]
        symbolQuoteApiResponse = await getCompanyQuote(symbol)
        callsIndex++
        symbolProfileApiResponse = await getCompanyProfile(symbol)
        callsIndex++
        stockData = await getStockFromDatabase(symbol)
        isStockAlreadyInWatchlist =
          stockData !== null && stockData.isOnWatchlist

        // validacion primaria, si no se cumple, ya termino de paginar y buscar en finviz
        if (isOffHighsValid(symbolQuoteApiResponse.data)) {
          // validaciones secundarias
          if (
            isValidMarketCap(symbolQuoteApiResponse.data) &&
            isValidIpoDate(symbolProfileApiResponse.data) &&
            !isStockAlreadyInWatchlist
          ) {
            symbolsToQuery.push({
              tickerSymbol: symbol,
              name:
                symbolQuoteApiResponse.data.length > 0
                  ? symbolQuoteApiResponse.data[0].name
                  : '(Sin nombre)',
              industry:
                symbolProfileApiResponse.data.length > 0
                  ? symbolProfileApiResponse.data[0].industry
                  : '(Sin industria)',
            })
          }

          index++

          // paginar si corresponde
          if (
            numberOfElementsPerPage >= 20 &&
            batchIndex >= numberOfElementsPerPage
          ) {
            pageOffset = batchIndex + 1
            batchOfElementsToScan = await getWeeklyTopStocksFromFinviz(
              pageOffset
            )
            numberOfElementsPerPage = batchOfElementsToScan.length
            index = 0
          }
        } else {
          console.log('entro a else final', symbol)
          batchOfElementsToScan = [] // reseteo para salir del bucle
        }
      } catch (err) {
        console.log('error bucle', err, symbol)
        return null
      }
    }
    return symbolsToQuery
  },
}
