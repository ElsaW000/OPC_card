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

  ;[absolutePath, userServicePath, cardServicePath, apiConfigPath, httpClientPath].forEach((moduleId) => {
    delete require.cache[moduleId]
  })
}

async function main() {
  await testAccountInfoOnlyShowsInDevMode()
  console.log('management page tests passed')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})