const { getApiBaseUrl } = require('./apiConfig')
const { normalizeError } = require('./errorUtils')

function request({ url, method = 'GET', data = null, userId = '', timeout = 10000 }) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${getApiBaseUrl()}${url}`,
      method,
      data,
      timeout,
      header: {
        'Content-Type': 'application/json',
        ...(userId ? { 'X-User-Id': userId } : {}),
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
          return
        }
        reject(normalizeError(res.data, 'request failed'))
      },
      fail: (error) => reject(normalizeError(error, 'request failed'))
    })
  })
}

module.exports = {
  request,
  normalizeError,
}
