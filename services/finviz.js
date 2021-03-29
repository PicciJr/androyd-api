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
    const { yearHigh = null, price = null } = data[0]
    if (yearHigh !== null && price !== null) {
      const offValidMeasure = 1 - 0.25 // 25% de distancia a maximos como mucho
      return price * offValidMeasure <= yearHigh
    } else return true
  } else return true
}

const isValidMarketCap = (data) => {
  if (typeof data[0] !== 'undefined') {
    const { marketCap = null } = data[0]
    if (marketCap !== null) {
      const maxMarketCapAllowed = 40000000000 // 40B
      return marketCap <= maxMarketCapAllowed
    } else return true
  } else return true
}

const isValidIpoDate = (data) => {
  if (typeof data[0] !== 'undefined') {
    const { ipoDate = null } = data[0]
    // le tengo que asignar un valor por defecto en el parametro
    // por si la llamada a la API no retorna un ipoDate, que para algunos valores pasa
    const maxIpoDateAllowed = 2015
    if (ipoDate !== null) {
      const year = ipoDate.split('-')[0]
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
    console.log('elementos por pagina', numberOfElementsPerPage)
    console.log('array de simbolos a escanear', batchOfElementsToScan)

    let nonMatchingElementHasBeenFound = false // true tras encontrar el primer valor que esté a +25% maximos

    let maxCallsApiReached = 20
    let callsIndex = 0
    let batchIndex = 0
    while (!nonMatchingElementHasBeenFound) {
      for (const symbol of batchOfElementsToScan) {
        try {
          callsIndex++
          batchIndex++
          if (callsIndex <= maxCallsApiReached) {
            const symbolQuoteApiResponse = await getCompanyQuote(symbol)
            const symbolProfileApiResponse = await getCompanyProfile(symbol)
            const stockData = await getStockFromDatabase(symbol)
            const isStockAlreadyInWatchlist =
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

              // paginar si corresponde
              if (
                numberOfElementsPerPage >= 20 &&
                batchIndex >= numberOfElementsPerPage
              ) {
                numberOfElementsPerPage = batchOfElementsToScan.length + 1
                batchOfElementsToScan = await getWeeklyTopStocksFromFinviz(
                  numberOfElementsPerPage
                )
                batchIndex = 0
              } else nonMatchingElementHasBeenFound = true // ya no debo paginar mas porque no hay mas elementos
            } else {
              nonMatchingElementHasBeenFound = true
              break
            }
          }
        } catch (err) {
          console.log('error bucle', err, symbol)
          return null
        }
      }
    }
    console.log(
      'finalizo bucle while',
      nonMatchingElementHasBeenFound,
      symbolsToQuery
    )
    return symbolsToQuery
  },
}
