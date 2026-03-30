const { request } = require('./httpClient')

async function generateAI(type, data = {}) {
  return request({
    url: '/ai/generate',
    method: 'POST',
    data: { type, data }
  })
}

module.exports = {
  generateAI,
}
