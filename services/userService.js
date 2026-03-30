const { readDatabase, writeDatabase, nowIso } = require('./mockDatabase')
const { isRemoteApiEnabled } = require('./apiConfig')
const { request, normalizeError } = require('./httpClient')

const SESSION_KEY = 'opc_remote_session'

function saveRemoteSession(session) {
  wx.setStorageSync(SESSION_KEY, session)
}

function clearRemoteSession() {
  wx.removeStorageSync(SESSION_KEY)
}

function getRemoteSession() {
  return wx.getStorageSync(SESSION_KEY) || null
}

function bootstrapSession() {
  const db = readDatabase()
  db.currentUser.updatedAt = nowIso()
  writeDatabase(db)
  return {
    success: true,
    userId: db.currentUser.userId,
    openid: db.currentUser.openid,
    appid: db.currentUser.appid,
    mode: 'local-storage'
  }
}

function bootstrapSessionAsync() {
  if (!isRemoteApiEnabled()) {
    const session = bootstrapSession()
    return Promise.resolve(session)
  }

  return new Promise((resolve, reject) => {
    wx.login({
      success: async (loginRes) => {
        try {
          const result = await request({
            url: '/auth/wechat/login',
            method: 'POST',
            data: { code: loginRes.code || `mock_${Date.now()}` },
          })
          const session = {
            success: true,
            userId: result.user_id,
            openid: result.openid,
            sessionToken: result.session_token,
            isNewUser: !!result.is_new_user,
            appid: 'wxbe5da72c15a309b9',
            mode: 'remote-api'
          }
          saveRemoteSession(session)
          resolve(session)
        } catch (error) {
          clearRemoteSession()
          reject(normalizeError(error, 'login failed'))
        }
      },
      fail: (error) => {
        clearRemoteSession()
        reject(normalizeError(error, 'wechat login failed'))
      },
    })
  })
}

function getCurrentUser() {
  const remoteSession = getRemoteSession()
  if (isRemoteApiEnabled() && remoteSession && remoteSession.userId) {
    return {
      userId: remoteSession.userId,
      openid: remoteSession.openid,
      appid: remoteSession.appid || 'wxbe5da72c15a309b9',
      mode: 'remote-api'
    }
  }
  return readDatabase().currentUser
}

module.exports = {
  bootstrapSession,
  bootstrapSessionAsync,
  getCurrentUser,
  getRemoteSession,
  clearRemoteSession,
}
