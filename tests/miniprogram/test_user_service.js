const assert = require('assert')
const path = require('path')

function mockModule(modulePath, exportsObject) {
  const absolutePath = path.resolve(modulePath)
  require.cache[absolutePath] = {
    id: absolutePath,
    filename: absolutePath,
    loaded: true,
    exports: exportsObject,
  }
  return absolutePath
}

async function testRemoteLoginFailureDoesNotDisableRemoteMode() {
  const mockDb = {
    currentUser: {
      userId: 'local_user_1',
      openid: 'local_openid_1',
      appid: 'wx_local_appid',
    },
  }
  let remoteEnabled = true
  let disableCalls = 0

  const mockDatabasePath = mockModule('services/mockDatabase.js', {
    readDatabase: () => mockDb,
    writeDatabase: () => {},
    nowIso: () => '2026-04-02T00:00:00.000Z',
  })
  const apiConfigPath = mockModule('services/apiConfig.js', {
    isRemoteApiEnabled: () => remoteEnabled,
    allowsLocalMockFallback: () => true,
    setRemoteApiEnabled: (enabled) => {
      remoteEnabled = !!enabled
      if (!enabled) disableCalls += 1
    },
  })
  const httpClientPath = mockModule('services/httpClient.js', {
    request: async () => {
      throw new Error('network down')
    },
    normalizeError: (error, fallback) => ({
      message: (error && error.message) || fallback,
    }),
  })

  const storage = new Map()
  global.wx = {
    login({ success }) {
      success({ code: 'wx_code_1' })
    },
    setStorageSync(key, value) {
      storage.set(key, value)
    },
    getStorageSync(key) {
      return storage.get(key)
    },
    removeStorageSync(key) {
      storage.delete(key)
    },
  }

  const servicePath = path.resolve('services/userService.js')
  delete require.cache[servicePath]
  const userService = require(servicePath)

  const result = await userService.bootstrapSessionAsync()

  assert.strictEqual(result.mode, 'local-storage')
  assert.strictEqual(result.fallbackFromRemote, true)
  assert.strictEqual(remoteEnabled, true, 'temporary remote failure should not permanently disable remote mode')
  assert.strictEqual(disableCalls, 0, 'remote failure should not call setRemoteApiEnabled(false)')
  assert.strictEqual(typeof userService.hasAuthenticatedRemoteSession, 'function')
  assert.strictEqual(userService.hasAuthenticatedRemoteSession(), false)

  ;[servicePath, mockDatabasePath, apiConfigPath, httpClientPath].forEach((moduleId) => {
    delete require.cache[moduleId]
  })
}

async function testRemoteLoginSuccessMarksAuthenticatedRemoteSession() {
  const mockDb = {
    currentUser: {
      userId: 'local_user_1',
      openid: 'local_openid_1',
      appid: 'wx_local_appid',
    },
  }

  const mockDatabasePath = mockModule('services/mockDatabase.js', {
    readDatabase: () => mockDb,
    writeDatabase: () => {},
    nowIso: () => '2026-04-02T00:00:00.000Z',
  })
  const apiConfigPath = mockModule('services/apiConfig.js', {
    isRemoteApiEnabled: () => true,
    allowsLocalMockFallback: () => true,
    setRemoteApiEnabled: () => {},
  })
  const httpClientPath = mockModule('services/httpClient.js', {
    request: async () => ({
      user_id: 'remote_user_1',
      openid: 'remote_openid_1',
      session_token: 'session_token_1',
      is_new_user: false,
    }),
    normalizeError: (error, fallback) => ({
      message: (error && error.message) || fallback,
    }),
  })

  const storage = new Map()
  global.wx = {
    login({ success }) {
      success({ code: 'wx_code_2' })
    },
    setStorageSync(key, value) {
      storage.set(key, value)
    },
    getStorageSync(key) {
      return storage.get(key)
    },
    removeStorageSync(key) {
      storage.delete(key)
    },
  }

  const servicePath = path.resolve('services/userService.js')
  delete require.cache[servicePath]
  const userService = require(servicePath)

  const result = await userService.bootstrapSessionAsync()

  assert.strictEqual(result.mode, 'remote-api')
  assert.strictEqual(userService.hasAuthenticatedRemoteSession(), true)

  ;[servicePath, mockDatabasePath, apiConfigPath, httpClientPath].forEach((moduleId) => {
    delete require.cache[moduleId]
  })
}

async function testStagingRemoteLoginFailureDoesNotFallbackToLocalSession() {
  const mockDb = {
    currentUser: {
      userId: 'local_user_1',
      openid: 'local_openid_1',
      appid: 'wx_local_appid',
    },
  }

  const mockDatabasePath = mockModule('services/mockDatabase.js', {
    readDatabase: () => mockDb,
    writeDatabase: () => {},
    nowIso: () => '2026-04-03T00:00:00.000Z',
  })
  const apiConfigPath = mockModule('services/apiConfig.js', {
    isRemoteApiEnabled: () => true,
    getRuntimeEnv: () => 'staging',
    allowsLocalMockFallback: () => false,
    setRemoteApiEnabled: () => {},
  })
  const httpClientPath = mockModule('services/httpClient.js', {
    request: async () => {
      throw new Error('network down')
    },
    normalizeError: (error, fallback) => ({
      message: (error && error.message) || fallback,
    }),
  })

  const storage = new Map()
  global.wx = {
    login({ success }) {
      success({ code: 'wx_code_stage_1' })
    },
    setStorageSync(key, value) {
      storage.set(key, value)
    },
    getStorageSync(key) {
      return storage.get(key)
    },
    removeStorageSync(key) {
      storage.delete(key)
    },
  }

  const servicePath = path.resolve('services/userService.js')
  delete require.cache[servicePath]
  const userService = require(servicePath)

  const result = await userService.bootstrapSessionAsync()

  assert.strictEqual(result.mode, 'remote-api', 'staging remote failure should stay in remote mode')
  assert.strictEqual(result.success, false, 'staging remote failure should be explicit')
  assert.strictEqual(result.fallbackFromRemote, false, 'staging should not auto-fallback to local mock')
  assert.strictEqual(result.sessionState.status, 'remote_unavailable')
  assert.strictEqual(result.sessionState.reason, 'remote-login-failed')

  ;[servicePath, mockDatabasePath, apiConfigPath, httpClientPath].forEach((moduleId) => {
    delete require.cache[moduleId]
  })
}

async function main() {
  await testRemoteLoginFailureDoesNotDisableRemoteMode()
  await testRemoteLoginSuccessMarksAuthenticatedRemoteSession()
  await testStagingRemoteLoginFailureDoesNotFallbackToLocalSession()
  console.log('user service tests passed')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
