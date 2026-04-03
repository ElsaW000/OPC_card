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

function createTimerHarness() {
  const timers = []
  let nextId = 1
  const previousSetTimeout = global.setTimeout

  global.setTimeout = (fn, delay) => {
    timers.push({ id: nextId, fn, delay })
    nextId += 1
    return nextId - 1
  }

  return {
    runAll() {
      while (timers.length) {
        const timer = timers.shift()
        timer.fn()
      }
    },
    restore() {
      global.setTimeout = previousSetTimeout
    },
  }
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

async function testConfirmExchangeNavigatesToContactsOnSuccess() {
  let requestedCardId = ''
  const timerHarness = createTimerHarness()
  const contactServicePath = mockModule('services/contactService.js', {
    createExchangeRequestAsync: async (cardId) => {
      requestedCardId = cardId
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

  const switchTabs = []
  const toastCalls = []
  global.wx = {
    showToast: (options) => toastCalls.push(options),
    showLoading: () => {},
    hideLoading: () => {},
    switchTab: (options) => switchTabs.push(options),
    navigateBack: () => {},
  }

  const { definition, absolutePath } = loadPageDefinition('pages/exchangeconfirm/exchangeconfirm.js')
  const ctx = {
    data: {
      loading: false,
      cardId: 'card_exchange_target',
      card: { _id: 'card_exchange_target' },
    },
    setData(update) {
      this.data = { ...this.data, ...update }
    },
  }

  await definition.confirmExchange.call(ctx)
  timerHarness.runAll()

  assert.strictEqual(requestedCardId, 'card_exchange_target', '确认交换时应把当前目标名片 id 传给 service')
  assert.strictEqual(ctx.data.loading, false, '交换成功后应恢复 loading 状态')
  assert.strictEqual(toastCalls[0].title, '交换请求已发送')
  assert.deepStrictEqual(switchTabs[0], { url: '/pages/contacts/contacts' }, '交换成功后应跳回联系人页')

  timerHarness.restore()
  ;[absolutePath, contactServicePath, cardServicePath, userServicePath, errorUtilsPath].forEach((moduleId) => {
    delete require.cache[moduleId]
  })
}

async function main() {
  await testConfirmExchangeIgnoresReentryWhileLoading()
  await testConfirmExchangeNavigatesToContactsOnSuccess()
  console.log('exchangeconfirm tests passed')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
