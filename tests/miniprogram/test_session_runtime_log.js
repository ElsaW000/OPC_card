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

function cleanup(moduleIds) {
  moduleIds.forEach((moduleId) => {
    delete require.cache[moduleId]
  })
}

function createStorage() {
  const storage = new Map()
  return {
    getStorageSync: (key) => storage.get(key),
    setStorageSync: (key, value) => storage.set(key, value),
    removeStorageSync: (key) => storage.delete(key),
  }
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

async function runRemoteUnavailableScenario() {
  const requestLog = []
  const infoLog = []
  const storage = createStorage()

  global.getApp = () => ({ globalData: {} })
  global.wx = {
    ...storage,
    login({ success }) {
      success({ code: 'wx_code_fail' })
    },
    showToast: () => {},
    navigateTo: () => {},
    switchTab: () => {},
  }

  const originalInfo = console.info
  console.info = (message) => {
    infoLog.push(String(message))
  }

  const apiConfigPath = mockModule('services/apiConfig.js', {
    isRemoteApiEnabled: () => true,
    setRemoteApiEnabled: () => {},
  })
  const httpClientPath = mockModule('services/httpClient.js', {
    request: async (options) => {
      requestLog.push(options.url)
      if (options.url === '/auth/wechat/login') {
        throw new Error('network down')
      }
      throw new Error(`unexpected request ${options.url}`)
    },
    normalizeError: (error, fallback) => ({
      message: (error && error.message) || fallback,
    }),
  })

  const userServicePath = path.resolve('services/userService.js')
  const cardServicePath = path.resolve('services/cardService.js')
  const contactServicePath = path.resolve('services/contactService.js')
  const workbenchServicePath = path.resolve('services/workbenchService.js')
  const visitorServicePath = path.resolve('services/visitorService.js')
  const settingsServicePath = path.resolve('services/settingsService.js')

  const userService = require(userServicePath)
  const cardService = require(cardServicePath)
  const contactService = require(contactServicePath)
  const workbenchService = require(workbenchServicePath)

  const session = await userService.bootstrapSessionAsync()
  const workbench = await workbenchService.getWorkbenchAsync()
  const contacts = await contactService.getContactsAsync()
  const cards = await cardService.getCardsAsync()

  console.info = originalInfo

  assert.strictEqual(session.sessionState.status, 'remote_unavailable')
  assert.deepStrictEqual(requestLog, ['/auth/wechat/login'])
  assert.strictEqual(workbench.mode, 'local-storage')
  assert.strictEqual(contacts.mode, 'local-storage')
  assert.strictEqual(cards.mode, 'local-storage')

  cleanup([
    apiConfigPath,
    httpClientPath,
    userServicePath,
    cardServicePath,
    contactServicePath,
    workbenchServicePath,
    visitorServicePath,
    settingsServicePath,
  ])

  return { requestLog, infoLog }
}

async function runRemoteReadyScenario() {
  const requestLog = []
  const infoLog = []
  const storage = createStorage()

  global.getApp = () => ({ globalData: {} })
  global.wx = {
    ...storage,
    login({ success }) {
      success({ code: 'wx_code_success' })
    },
    showToast: () => {},
    navigateTo: () => {},
    switchTab: () => {},
  }

  const originalInfo = console.info
  console.info = (message) => {
    infoLog.push(String(message))
  }

  const apiConfigPath = mockModule('services/apiConfig.js', {
    getApiBaseUrl: () => 'http://127.0.0.1:8004/api/v1',
    setApiBaseUrl: () => {},
    isRemoteApiEnabled: () => true,
    setRemoteApiEnabled: () => {},
  })
  const httpClientPath = mockModule('services/httpClient.js', {
    request: async (options) => {
      requestLog.push(options.url)
      if (options.url === '/auth/wechat/login') {
        return {
          user_id: 'remote_user_1',
          openid: 'remote_openid_1',
          session_token: 'token_1',
          is_new_user: false,
        }
      }
      if (options.url === '/auth/me') {
        return {
          success: true,
          user: { id: 'remote_user_1', nickname: '远程用户', phone: '13800001111' },
          settings: { privacy_mode: '交换后可见', public_dynamics: true, ai_tone: '专业友好' },
        }
      }
      if (options.url === '/workbench') {
        return {
          weeklyViews: 6,
          visitorCount: 2,
          personaTags: [{ label: 'AI', size: 120 }],
          starredContacts: [],
          recentVisitors: [],
          settingsSummary: { aiTone: '专业友好', publicDynamics: true, privacyMode: '交换后可见', blacklistCount: 0 },
        }
      }
      if (options.url === '/contacts') {
        return {
          contacts: [],
          pendingRequests: [],
          updatedTips: [],
          tags: ['全部'],
        }
      }
      if (options.url === '/cards') {
        return {
          items: [{ id: 'card_remote_1', title: '远程名片', is_default: true, name: '远程用户', role: '产品经理' }],
        }
      }
      throw new Error(`unexpected request ${options.url}`)
    },
    normalizeError: (error, fallback) => ({
      message: (error && error.message) || fallback,
    }),
  })
  const settingsServicePath = mockModule('services/settingsService.js', {
    readSettings: () => ({ allowAiContactsContext: false }),
    updateSettings: (patch) => patch,
  })

  const userServicePath = path.resolve('services/userService.js')
  const cardServicePath = path.resolve('services/cardService.js')
  const contactServicePath = path.resolve('services/contactService.js')
  const workbenchServicePath = path.resolve('services/workbenchService.js')
  const visitorServicePath = path.resolve('services/visitorService.js')

  const userService = require(userServicePath)
  const cardService = require(cardServicePath)
  const contactService = require(contactServicePath)
  const workbenchService = require(workbenchServicePath)

  const session = await userService.bootstrapSessionAsync()

  const cardServiceMockPath = mockModule('services/cardService.js', {
    getCards: () => ({ defaultCard: { name: '远程用户', phone: '13800001111', wechat: '' } }),
  })
  const managementSettingsServicePath = mockModule('services/settingsService.js', {
    readSettings: () => ({ allowAiContactsContext: false }),
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

  const workbench = await workbenchService.getWorkbenchAsync()
  const contacts = await contactService.getContactsAsync()
  const cards = await cardService.getCardsAsync()

  console.info = originalInfo

  assert.strictEqual(session.sessionState.status, 'remote_ready')
  assert.deepStrictEqual(requestLog, ['/auth/wechat/login', '/auth/me', '/workbench', '/contacts', '/cards'])
  assert.strictEqual(workbench.mode, 'remote-api')
  assert.strictEqual(contacts.mode, 'remote-api')
  assert.strictEqual(cards.mode, 'remote-api')

  cleanup([
    absolutePath,
    apiConfigPath,
    httpClientPath,
    settingsServicePath,
    managementSettingsServicePath,
    cardServiceMockPath,
    userServicePath,
    cardServicePath,
    contactServicePath,
    workbenchServicePath,
    visitorServicePath,
  ])

  return { requestLog, infoLog }
}

async function main() {
  const unavailable = await runRemoteUnavailableScenario()
  console.log('[runtime-log] remote_unavailable requests:', unavailable.requestLog.join(', '))
  unavailable.infoLog.forEach((line) => console.log(line))

  const ready = await runRemoteReadyScenario()
  console.log('[runtime-log] remote_ready requests:', ready.requestLog.join(', '))
  ready.infoLog.forEach((line) => console.log(line))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
