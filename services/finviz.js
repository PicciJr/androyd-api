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

const isOffHighsValid = ({ yearHigh = null, price = null }) => {
  // en el momento en el que esta funcion se cumpla, ya me habré topado realmente con el primer valor invalido
  if (yearHigh !== nul && price !== null) {
    const offValidMeasure = 1 - 0.25 // 25% de distancia a maximos como mucho
    return price * offValidMeasure <= yearHigh
  } else return false
}

const isValidMarketCap = ({ marketCap = null }) => {
  if (marketCap !== null) {
    const maxMarketCapAllowed = 40000000000 // 40B
    return marketCap <= maxMarketCapAllowed
  } else return false
}

const isValidIpoDate = ({ ipoDate } = 2015) => {
  // le tengo que asignar un valor por defecto en el parametro
  // por si la llamada a la API no retorna un ipoDate, que para algunos valores pasa
  const maxIpoDateAllowed = 2015
  if (typeof ipoDate !== 'undefined') {
    const year = ipoDate.split('-')[0]
    return parseInt(year) > maxIpoDateAllowed
  }
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

    let maxCallsApiReached = 30
    let i = 0
    while (!nonMatchingElementHasBeenFound) {
      for (const symbol of batchOfElementsToScan) {
        try {
          i++
          if (i <= maxCallsApiReached) {
            const symbolQuoteApiResponse = await getCompanyQuote(symbol)
            const symbolProfileApiResponse = await getCompanyProfile(symbol)
            const stockData = await getStockFromDatabase(symbol)
            const isStockAlreadyInWatchlist =
              stockData !== null && stockData.isOnWatchlist

            // validacion primaria, si no se cumple, ya termino de paginar y buscar en finviz
            if (isOffHighsValid(symbolQuoteApiResponse.data[0])) {
              // validaciones secundarias
              if (
                isValidMarketCap(symbolQuoteApiResponse.data[0]) &&
                isValidIpoDate(symbolProfileApiResponse.data[0]) &&
                !isStockAlreadyInWatchlist
              ) {
                symbolsToQuery.push({
                  tickerSymbol: symbol,
                  name: symbolQuoteApiResponse.data[0].name,
                  industry: symbolProfileApiResponse.data[0].industry,
                })
              }

              // paginar si corresponde
              if (numberOfElementsPerPage >= 20) {
                numberOfElementsPerPage = batchOfElementsToScan.length + 1
                batchOfElementsToScan = await getWeeklyTopStocksFromFinviz(
                  numberOfElementsPerPage
                )
              } else {
                // ya no ay que iterar más ya que no hay más paginacion
                nonMatchingElementHasBeenFound = true
                break
              }
            } else {
              nonMatchingElementHasBeenFound = true
              break
            }
          }
        } catch (err) {
          console.log('error bucle', err)
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
