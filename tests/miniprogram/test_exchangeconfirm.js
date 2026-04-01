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

async function testConfirmExchangeIgnoresReentryWhileLoading() {
  let called = 0
  const contactServicePath = mockModule('services/contactService.js', {
    createExchangeRequestAsync: async () => {
      called += 1
      return { success: true }
    },
  })
  const cardServicePath = mockModule('services/cardService.js', {
    getCardViewAsync: async () => ({ success: true, data: {} }),
  })
  const userServicePath = mockModule('services/userService.js', {
    bootstrapSessionAsync: async () => ({ success: true }),
  })
  const errorUtilsPath = mockModule('services/errorUtils.js', {
    getErrorMessage: (error, fallback) => (error && error.message) || fallback,
  })

  const toastCalls = []
  global.wx = {
    showToast: (options) => toastCalls.push(options),
    showLoading: () => {},
    hideLoading: () => {},
    switchTab: () => {},
    navigateBack: () => {},
  }

  const { definition, absolutePath } = loadPageDefinition('pages/exchangeconfirm/exchangeconfirm.js')
  const ctx = {
    data: {
      loading: true,
      cardId: 'card_1',
      card: { _id: 'card_1' },
    },
    setData(update) {
      this.data = { ...this.data, ...update }
    },
  }

  await definition.confirmExchange.call(ctx)

  assert.strictEqual(called, 0, 'loading 状态下不应重复发起交换请求')
  assert.strictEqual(toastCalls.length, 0)

  ;[absolutePath, contactServicePath, cardServicePath, userServicePath, errorUtilsPath].forEach((moduleId) => {
    delete require.cache[moduleId]
  })
}

async function main() {
  await testConfirmExchangeIgnoresReentryWhileLoading()
  console.log('exchangeconfirm tests passed')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})