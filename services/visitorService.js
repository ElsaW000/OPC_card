const { readDatabase } = require('./mockDatabase')
const { getCurrentUser } = require('./userService')
const { isRemoteApiEnabled } = require('./apiConfig')
const { request } = require('./httpClient')

function getVisitors() {
  const user = getCurrentUser()
  const db = readDatabase()
  return {
    success: true,
    visitors: db.visitors
      .filter((item) => item.ownerUserId === user.userId)
      .sort((a, b) => String(b.visitDate).localeCompare(String(a.visitDate))),
    mode: 'local-storage'
  }
}

async function getVisitorsAsync() {
  if (!isRemoteApiEnabled()) {
    return getVisitors()
  }
  const user = getCurrentUser()
  const result = await request({ url: '/visitors', method: 'GET', userId: user.userId })
  return {
    success: true,
    visitors: result.visitors || [],
    mode: 'remote-api'
  }
}

module.exports = {
  getVisitors,
  getVisitorsAsync
}
