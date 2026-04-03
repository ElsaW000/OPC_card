const { readDatabase } = require('./mockDatabase')
const { getCurrentUser, getAuthenticatedRemoteUser, hasAuthenticatedRemoteSession } = require('./userService')
const { isRemoteApiEnabled, allowsLocalMockFallback } = require('./apiConfig')
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

function canFallbackToLocalMock() {
  return typeof allowsLocalMockFallback === 'function' ? allowsLocalMockFallback() : true
}

function canUseProtectedRemoteApi() {
  if (!isRemoteApiEnabled()) return false
  if (typeof hasAuthenticatedRemoteSession === 'function') {
    return !!hasAuthenticatedRemoteSession()
  }
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null
  return !!(user && user.userId)
}

function getProtectedRemoteUser() {
  if (typeof getAuthenticatedRemoteUser === 'function') {
    return getAuthenticatedRemoteUser()
  }
  return typeof getCurrentUser === 'function' ? getCurrentUser() : null
}

async function getVisitorsAsync() {
  if (!canUseProtectedRemoteApi()) {
    if (isRemoteApiEnabled() && !canFallbackToLocalMock()) {
      return { success: false, visitors: [], error: '远程登录未就绪', mode: 'remote-unavailable' }
    }
    return getVisitors()
  }
  const user = getProtectedRemoteUser()
  if (!user || !user.userId) {
    if (isRemoteApiEnabled() && !canFallbackToLocalMock()) {
      return { success: false, visitors: [], error: '远程登录未就绪', mode: 'remote-unavailable' }
    }
    return getVisitors()
  }
  const result = await request({ url: '/visitors', method: 'GET', userId: user.userId })
  return {
    success: true,
    visitors: result.visitors || [],
    mode: 'remote-api'
  }
}

async function recordVisitorAsync(cardId, source) {
  if (!canUseProtectedRemoteApi()) {
    if (isRemoteApiEnabled() && !canFallbackToLocalMock()) {
      return { success: false, error: '远程登录未就绪', mode: 'remote-unavailable' }
    }
    return { success: true, mode: 'local-storage' }
  }
  const user = getProtectedRemoteUser()
  if (!user || !user.userId) {
    if (isRemoteApiEnabled() && !canFallbackToLocalMock()) {
      return { success: false, error: '远程登录未就绪', mode: 'remote-unavailable' }
    }
    return { success: true, mode: 'local-storage' }
  }
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
