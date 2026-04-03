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
  const previousGetApp = global.getApp
  let definition = null

  global.Page = (config) => {
    definition = config
  }
  global.getApp = () => ({ globalData: {} })

  delete require.cache[absolutePath]
  require(absolutePath)

  global.Page = previousPage
  global.getApp = previousGetApp

  return { definition, absolutePath }
}

function createContext(definition, data = {}) {
  return {
    ...definition,
    data: {
      ...JSON.parse(JSON.stringify(definition.data || {})),
      ...data,
    },
    setData(update) {
      this.data = { ...this.data, ...update }
    },
  }
}

async function testSubmitExchangeCodeGuardsEmptyAndNavigatesOnValidCode() {
  const cardServicePath = mockModule('services/cardService.js', {
    getCardsAsync: async () => ({ data: [] }),
  })
  const userServicePath = mockModule('services/userService.js', {
    bootstrapSessionAsync: async () => ({ success: true }),
  })

  const toastCalls = []
  const navigateCalls = []
  global.wx = {
    showToast: (options) => toastCalls.push(options),
    navigateTo: (options) => navigateCalls.push(options),
    switchTab: () => {},
    scanCode: () => {},
  }

  const { definition, absolutePath } = loadPageDefinition('pages/exchange/exchange.js')
  const ctx = createContext(definition, { exchangeCode: '' })

  definition.submitExchangeCode.call(ctx)
  assert.strictEqual(toastCalls[0].title, '请输入交换码', '空交换码时应先提示用户补充')

  ctx.setData({ exchangeCode: 'ES-card_visitor_1' })
  definition.submitExchangeCode.call(ctx)
  assert.deepStrictEqual(
    navigateCalls[0],
    { url: '/pages/cardDetail/cardDetail?id=card_visitor_1&visitor=1' },
    '合法交换码应直接进入 visitor 名片详情'
  )

  ;[absolutePath, cardServicePath, userServicePath].forEach((moduleId) => {
    delete require.cache[moduleId]
  })
}

async function testStartScanNavigatesToVisitorCardDetail() {
  const cardServicePath = mockModule('services/cardService.js', {
    getCardsAsync: async () => ({ data: [] }),
  })
  const userServicePath = mockModule('services/userService.js', {
    bootstrapSessionAsync: async () => ({ success: true }),
  })

  const toastCalls = []
  const navigateCalls = []
  global.wx = {
    showToast: (options) => toastCalls.push(options),
    navigateTo: (options) => navigateCalls.push(options),
    switchTab: () => {},
    scanCode(options) {
      options.success({ result: '/pages/cardDetail/cardDetail?id=card_scan_target&visitor=1' })
    },
  }

  const { definition, absolutePath } = loadPageDefinition('pages/exchange/exchange.js')
  const ctx = createContext(definition)

  definition.startScan.call(ctx)

  assert.strictEqual(toastCalls[0].title, '扫描成功')
  assert.deepStrictEqual(
    navigateCalls[0],
    { url: '/pages/cardDetail/cardDetail?id=card_scan_target&visitor=1' },
    '扫码成功后应进入 visitor 名片详情'
  )

  ;[absolutePath, cardServicePath, userServicePath].forEach((moduleId) => {
    delete require.cache[moduleId]
  })
}

async function testVisitorExchangeButtonGoesToExchangeConfirm() {
  const cardServicePath = mockModule('services/cardService.js', {
    getCardViewAsync: async () => ({ success: true, data: {} }),
    setDefaultCardAsync: async () => ({ success: true }),
  })
  const userServicePath = mockModule('services/userService.js', {
    bootstrapSessionAsync: async () => ({ success: true }),
  })
  const visitorServicePath = mockModule('services/visitorService.js', {
    recordVisitorAsync: async () => ({ success: true }),
  })

  const navigateCalls = []
  global.wx = {
    navigateTo: (options) => navigateCalls.push(options),
    showToast: () => {},
    showActionSheet: () => {},
    navigateBack: () => {},
  }

  const { definition, absolutePath } = loadPageDefinition('pages/cardDetail/cardDetail.js')
  const ctx = createContext(definition, {
    card: { id: 'card_from_visitor' },
    isVisitorMode: true,
  })

  definition.exchangeCard.call(ctx)

  assert.deepStrictEqual(
    navigateCalls[0],
    { url: '/pages/exchangeconfirm/exchangeconfirm?id=card_from_visitor' },
    'visitor 模式点击交换名片应直接进入确认页'
  )

  ;[absolutePath, cardServicePath, userServicePath, visitorServicePath].forEach((moduleId) => {
    delete require.cache[moduleId]
  })
}

async function testQrcodeCopyUsesExchangeCode() {
  const cardServicePath = mockModule('services/cardService.js', {
    getCardViewAsync: async () => ({ success: true, data: {} }),
  })
  const userServicePath = mockModule('services/userService.js', {
    bootstrapSessionAsync: async () => ({ success: true }),
  })
  const apiConfigPath = mockModule('services/apiConfig.js', {
    getApiBaseUrl: () => 'http://127.0.0.1:8004/api/v1',
  })

  const clipboardCalls = []
  const toastCalls = []
  global.wx = {
    downloadFile: () => {},
    setClipboardData(options) {
      clipboardCalls.push(options)
      if (typeof options.success === 'function') {
        options.success()
      }
    },
    showToast: (options) => toastCalls.push(options),
  }

  const { definition, absolutePath } = loadPageDefinition('pages/qrcode/qrcode.js')
  const ctx = createContext(definition, {
    card: { id: 'card_copy_target' },
    sharePath: '/pages/cardDetail/cardDetail?id=card_copy_target&visitor=1',
  })

  definition.copyPath.call(ctx)

  assert.strictEqual(clipboardCalls[0].data, 'ES-card_copy_target', '复制二维码时应优先给出交换码')
  assert.strictEqual(toastCalls[0].title, '已复制')

  ;[absolutePath, cardServicePath, userServicePath, apiConfigPath].forEach((moduleId) => {
    delete require.cache[moduleId]
  })
}

async function main() {
  await testSubmitExchangeCodeGuardsEmptyAndNavigatesOnValidCode()
  await testStartScanNavigatesToVisitorCardDetail()
  await testVisitorExchangeButtonGoesToExchangeConfirm()
  await testQrcodeCopyUsesExchangeCode()
  console.log('exchange flow page tests passed')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
