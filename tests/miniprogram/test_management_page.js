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

function loadPageDefinition(filePath) {
  const absolutePath = path.resolve(filePath)
  const previousPage = global.Page
  let definition = null
  global.Page = (config) => {
    definition = config
  }
  delete require.cache[absolutePath]
  require(absolutePath)
  global.Page = previousPage
  return { definition, absolutePath }
}

async function testAccountInfoOnlyShowsInDevMode() {
  global.getApp = () => ({ globalData: { cardData: null } })
  global.wx = {
    getStorageSync: () => '',
    setStorageSync: () => {},
    showToast: () => {},
  }

  const userServicePath = mockModule('services/userService.js', {
    bootstrapSessionAsync: async () => ({ success: true }),
    getCurrentUser: () => ({ userId: 'user_1', openid: 'wx_openid_user', appid: 'wx_appid' }),
    hasAuthenticatedRemoteSession: () => false,
    clearRemoteSession: () => {},
  })
  const cardServicePath = mockModule('services/cardService.js', {
    getCards: () => ({ defaultCard: { name: '新用户', phone: '13800008000', wechat: '' } }),
  })
  const apiConfigPath = mockModule('services/apiConfig.js', {
    getApiBaseUrl: () => 'http://127.0.0.1:8004/api/v1',
    setApiBaseUrl: () => {},
    isRemoteApiEnabled: () => false,
    setRemoteApiEnabled: () => {},
  })
  const httpClientPath = mockModule('services/httpClient.js', {
    request: async () => ({ success: true }),
  })
  const settingsServicePath = mockModule('services/settingsService.js', {
    readSettings: () => ({}),
    updateSettings: (patch) => patch,
  })

  const { definition, absolutePath } = loadPageDefinition('pages/management/management.js')
  const ctx = {
    ...definition,
    data: JSON.parse(JSON.stringify(definition.data)),
    setData(update) {
      this.data = { ...this.data, ...update }
    },
  }

  await definition.onLoad.call(ctx)

  assert.strictEqual(ctx.data.isDev, false)
  assert.strictEqual(ctx.data.showAccountInfo, false, '账号资料默认不应暴露在普通管理页')

  for (let i = 0; i < 5; i += 1) {
    definition.tapVersion.call(ctx)
  }

  assert.strictEqual(ctx.data.isDev, true)
  assert.strictEqual(ctx.data.showAccountInfo, true, '进入开发者模式后才显示账号资料')

  ;[absolutePath, userServicePath, cardServicePath, apiConfigPath, httpClientPath, settingsServicePath].forEach((moduleId) => {
    delete require.cache[moduleId]
  })
}

async function testLocalContactsContextSettingIsNotResetByManagementPage() {
  global.getApp = () => ({ globalData: { cardData: null } })
  global.wx = {
    getStorageSync: (key) => {
      if (key === 'eseat_local_settings') {
        return {
          privacy_mode: '交换后可见',
          public_dynamics: true,
          ai_tone: '专业友好',
        }
      }
      return ''
    },
    setStorageSync: () => {},
    showToast: () => {},
  }

  let localSettings = { allowAiContactsContext: true }

  const userServicePath = mockModule('services/userService.js', {
    bootstrapSessionAsync: async () => ({ success: true }),
    getCurrentUser: () => ({ userId: 'user_1', openid: 'wx_openid_user', appid: 'wx_appid' }),
    hasAuthenticatedRemoteSession: () => false,
    clearRemoteSession: () => {},
  })
  const cardServicePath = mockModule('services/cardService.js', {
    getCards: () => ({ defaultCard: { name: '新用户', phone: '13800008000', wechat: '' } }),
  })
  const apiConfigPath = mockModule('services/apiConfig.js', {
    getApiBaseUrl: () => 'http://127.0.0.1:8004/api/v1',
    setApiBaseUrl: () => {},
    isRemoteApiEnabled: () => false,
    setRemoteApiEnabled: () => {},
  })
  const httpClientPath = mockModule('services/httpClient.js', {
    request: async () => ({ success: true }),
  })
  const settingsServicePath = mockModule('services/settingsService.js', {
    readSettings: () => localSettings,
    updateSettings: (patch) => {
      localSettings = { ...localSettings, ...patch }
      return localSettings
    },
  })

  const { definition, absolutePath } = loadPageDefinition('pages/management/management.js')
  const ctx = {
    ...definition,
    data: JSON.parse(JSON.stringify(definition.data)),
    setData(update) {
      this.data = { ...this.data, ...update }
    },
  }

  await definition.onLoad.call(ctx)

  assert.strictEqual(ctx.data.aiContactsContextEnabled, true, '管理页加载后不应把本地联系人授权开关重置为 false')
  assert.strictEqual(localSettings.allowAiContactsContext, true, '本地设置存储不应被误覆盖')

  ;[absolutePath, userServicePath, cardServicePath, apiConfigPath, httpClientPath, settingsServicePath].forEach((moduleId) => {
    delete require.cache[moduleId]
  })
}

async function testManagementPageSkipsProtectedProfileRequestWithoutRemoteSession() {
  global.getApp = () => ({ globalData: { cardData: null } })
  global.wx = {
    getStorageSync: () => '',
    setStorageSync: () => {},
    showToast: () => {},
  }

  let requestCalls = 0

  const userServicePath = mockModule('services/userService.js', {
    bootstrapSessionAsync: async () => ({
      success: true,
      mode: 'local-storage',
      fallbackFromRemote: true,
    }),
    getCurrentUser: () => ({ userId: 'local_user_1', openid: 'local_openid_1', appid: 'wx_appid' }),
    hasAuthenticatedRemoteSession: () => false,
    clearRemoteSession: () => {},
  })
  const cardServicePath = mockModule('services/cardService.js', {
    getCards: () => ({ defaultCard: { name: '本地卡片', phone: '13800008000', wechat: '' } }),
  })
  const apiConfigPath = mockModule('services/apiConfig.js', {
    getApiBaseUrl: () => 'http://127.0.0.1:8004/api/v1',
    setApiBaseUrl: () => {},
    isRemoteApiEnabled: () => true,
    setRemoteApiEnabled: () => {},
  })
  const httpClientPath = mockModule('services/httpClient.js', {
    request: async () => {
      requestCalls += 1
      return { success: true }
    },
  })
  const settingsServicePath = mockModule('services/settingsService.js', {
    readSettings: () => ({}),
    updateSettings: (patch) => patch,
  })

  const { definition, absolutePath } = loadPageDefinition('pages/management/management.js')
  const ctx = {
    ...definition,
    data: JSON.parse(JSON.stringify(definition.data)),
    setData(update) {
      this.data = { ...this.data, ...update }
    },
  }

  await definition.onLoad.call(ctx)

  assert.strictEqual(requestCalls, 0, '远程登录未成功时不应请求 /auth/me')

  ;[absolutePath, userServicePath, cardServicePath, apiConfigPath, httpClientPath, settingsServicePath].forEach((moduleId) => {
    delete require.cache[moduleId]
  })
}

async function main() {
  await testAccountInfoOnlyShowsInDevMode()
  await testLocalContactsContextSettingIsNotResetByManagementPage()
  await testManagementPageSkipsProtectedProfileRequestWithoutRemoteSession()
  console.log('management page tests passed')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
