const { readDatabase, writeDatabase, nowIso } = require('./mockDatabase')
const { isRemoteApiEnabled, allowsLocalMockFallback } = require('./apiConfig')
const { request, normalizeError } = require('./httpClient')

const SESSION_KEY = 'opc_remote_session'
const SESSION_STATE_KEY = 'opc_session_state'

function canFallbackToLocalMock() {
  return typeof allowsLocalMockFallback === 'function' ? allowsLocalMockFallback() : true
}

function buildSessionState(status, extras = {}) {
  return {
    status,
    source: extras.source || (status === 'remote_ready' ? 'remote-api' : 'local-storage'),
    isAuthenticated: extras.isAuthenticated === true,
    fallbackFromRemote: extras.fallbackFromRemote === true,
    reason: extras.reason || '',
    message: extras.message || '',
    updatedAt: extras.updatedAt || nowIso(),
  }
}

function syncAppSessionState(sessionState) {
  try {
    const app = typeof getApp === 'function' ? getApp() : null
    if (app && app.globalData) {
      app.globalData.sessionState = sessionState
      app.globalData.sessionReady = sessionState.status !== 'booting'
    }
  } catch (error) {}
}

function setSessionState(sessionState) {
  wx.setStorageSync(SESSION_STATE_KEY, sessionState)
  syncAppSessionState(sessionState)
  try {
    console.info(
      `[session] status=${sessionState.status} source=${sessionState.source} authenticated=${sessionState.isAuthenticated ? 'yes' : 'no'} reason=${sessionState.reason || 'none'}`
    )
  } catch (error) {}
  return sessionState
}

function saveRemoteSession(session) {
  wx.setStorageSync(SESSION_KEY, session)
}

function clearRemoteSession() {
  wx.removeStorageSync(SESSION_KEY)
}

function getRemoteSession() {
  return wx.getStorageSync(SESSION_KEY) || null
}

function hasAuthenticatedRemoteSession() {
  if (!isRemoteApiEnabled()) return false
  const session = getRemoteSession()
  if (!session || typeof session !== 'object') return false
  return !!(session.userId && session.sessionToken)
}

function getAuthenticatedRemoteUser() {
  if (!hasAuthenticatedRemoteSession()) return null
  const session = getRemoteSession()
  return {
    userId: session.userId,
    openid: session.openid,
    appid: session.appid || 'wxbe5da72c15a309b9',
    mode: 'remote-api',
  }
}

function getSessionState() {
  const saved = wx.getStorageSync(SESSION_STATE_KEY)
  if (saved && typeof saved === 'object' && saved.status) {
    return saved
  }
  if (hasAuthenticatedRemoteSession()) {
    return buildSessionState('remote_ready', {
      source: 'remote-api',
      isAuthenticated: true,
      message: '远程登录已就绪',
    })
  }
  if (isRemoteApiEnabled()) {
    return buildSessionState('remote_unavailable', {
      source: 'local-storage',
      isAuthenticated: false,
      fallbackFromRemote: true,
      reason: 'remote-session-missing',
      message: canFallbackToLocalMock() ? '远程登录不可用，当前使用本地数据' : '远程登录不可用，请检查网络或后端服务',
    })
  }
  return buildSessionState('local_ready', {
    source: 'local-storage',
    isAuthenticated: false,
    message: '当前使用本地数据',
  })
}

function bootstrapSession() {
  const db = readDatabase()
  db.currentUser.updatedAt = nowIso()
  writeDatabase(db)
  const sessionState = setSessionState(buildSessionState('local_ready', {
    source: 'local-storage',
    isAuthenticated: false,
    message: '当前使用本地数据',
  }))
  return {
    success: true,
    userId: db.currentUser.userId,
    openid: db.currentUser.openid,
    appid: db.currentUser.appid,
    mode: 'local-storage',
    sessionState,
  }
}

function buildRemoteUnavailableResult(reason, error) {
  const message = normalizeError(error, reason).message || reason
  const sessionState = setSessionState(buildSessionState('remote_unavailable', {
    source: 'remote-api',
    isAuthenticated: false,
    fallbackFromRemote: false,
    reason,
    message,
  }))
  return {
    success: false,
    mode: 'remote-api',
    userId: '',
    openid: '',
    sessionToken: '',
    fallbackFromRemote: false,
    fallbackReason: message,
    sessionState,
  }
}

function bootstrapSessionAsync() {
  if (!isRemoteApiEnabled()) {
    const session = bootstrapSession()
    return Promise.resolve(session)
  }

  if (hasAuthenticatedRemoteSession()) {
    const sessionState = setSessionState(buildSessionState('remote_ready', {
      source: 'remote-api',
      isAuthenticated: true,
      message: '远程登录已就绪',
    }))
    return Promise.resolve({
      ...getRemoteSession(),
      success: true,
      mode: 'remote-api',
      sessionState,
    })
  }

  return new Promise((resolve) => {
    wx.login({
      success: async (loginRes) => {
        try {
          const result = await request({
            url: '/auth/wechat/login',
            method: 'POST',
            data: { code: loginRes.code || `mock_${Date.now()}` },
          })
          const sessionState = setSessionState(buildSessionState('remote_ready', {
            source: 'remote-api',
            isAuthenticated: true,
            message: '远程登录已就绪',
          }))
          const session = {
            success: true,
            userId: result.user_id,
            openid: result.openid,
            sessionToken: result.session_token,
            isNewUser: !!result.is_new_user,
            appid: 'wxbe5da72c15a309b9',
            mode: 'remote-api',
            sessionState,
          }
          saveRemoteSession(session)
          resolve(session)
        } catch (error) {
          clearRemoteSession()
          if (!canFallbackToLocalMock()) {
            resolve(buildRemoteUnavailableResult('remote-login-failed', error))
            return
          }
          const localSession = bootstrapSession()
          const sessionState = setSessionState(buildSessionState('remote_unavailable', {
            source: 'local-storage',
            isAuthenticated: false,
            fallbackFromRemote: true,
            reason: 'remote-login-failed',
            message: normalizeError(error, 'login failed').message || '远程登录失败，当前使用本地数据',
          }))
          resolve({
            ...localSession,
            fallbackFromRemote: true,
            fallbackReason: normalizeError(error, 'login failed').message || 'login failed',
            sessionState,
          })
        }
      },
      fail: (error) => {
        clearRemoteSession()
        if (!canFallbackToLocalMock()) {
          resolve(buildRemoteUnavailableResult('wechat-login-failed', error))
          return
        }
        const localSession = bootstrapSession()
        const sessionState = setSessionState(buildSessionState('remote_unavailable', {
          source: 'local-storage',
          isAuthenticated: false,
          fallbackFromRemote: true,
          reason: 'wechat-login-failed',
          message: normalizeError(error, 'wechat login failed').message || '微信登录失败，当前使用本地数据',
        }))
        resolve({
          ...localSession,
          fallbackFromRemote: true,
          fallbackReason: normalizeError(error, 'wechat login failed').message || 'wechat login failed',
          sessionState,
        })
      },
    })
  })
}

function getCurrentUser() {
  const remoteUser = getAuthenticatedRemoteUser()
  if (remoteUser) return remoteUser
  return readDatabase().currentUser
}

module.exports = {
  bootstrapSession,
  bootstrapSessionAsync,
  getCurrentUser,
  getAuthenticatedRemoteUser,
  getSessionState,
  hasAuthenticatedRemoteSession,
  getRemoteSession,
  clearRemoteSession,
}
