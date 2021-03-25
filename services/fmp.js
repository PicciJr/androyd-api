const baseConfig = require('../config')
const axios = require('axios')

const fmp = axios.create({
  baseURL: baseConfig.fmpApi.url,
  timeout: 10000,
})

const fmpApiKey = baseConfig.fmpApi.api_key

fmp.interceptors.request.use(
  function (config) {
    return config
  },
  function (error) {
    console.log('error interceptor', error)
    // Do something with request error
    return Promise.reject(error)
  }
)

module.exports = {
  /** 
   * https://financialmodelingprep.com/developer/docs/stock-api/   
   */
  getCompanyQuote: (symbol) => {
    return fmp.get(`/quote/${symbol}?apikey=${fmpApiKey}`)
  },
  /**
   * https://financialmodelingprep.com/developer/docs/companies-key-stats-free-api/ 
   */
  getCompanyProfile: (symbol) => {
    return fmp.get(`/profile/${symbol}?apikey=${fmpApiKey}`)
  },
}
