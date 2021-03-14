const baseConfig = require('../config')
const axios = require('axios')
exports.finhubApiKey = baseConfig.finhubApi.api_key

const finhubApi = axios.create({
  baseURL: baseConfig.finhubApi.url,
  timeout: 10000,
})

exports.finhubApi = finhubApi

finhubApi.interceptors.request.use(
  function (config) {
    return config
  },
  function (error) {
    console.log('error interceptor', error)
    // Do something with request error
    return Promise.reject(error)
  }
)
