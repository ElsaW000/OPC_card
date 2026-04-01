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

async function recordVisitorAsync(cardId, source) {
  if (!isRemoteApiEnabled()) {
    return { success: true, mode: 'local-storage' }
  }
  const user = getCurrentUser()
  const result = await request({
    url: '/visitors/record',
    method: 'POST',
    userId: user.userId,
    data: { card_id: cardId, source: source || '名片分享' }
  })
  return { success: true, visitor_id: result.visitor_id, mode: 'remote-api' }
}

module.exports = {
  getVisitors,
  getVisitorsAsync,
  recordVisitorAsync
}
