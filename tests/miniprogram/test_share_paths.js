const assert = require('assert')
const path = require('path')

function loadPageDefinition(filePath) {
  const absolutePath = path.resolve(filePath)
  const previousPage = global.Page
  const previousGetApp = global.getApp
  const previousWx = global.wx
  let definition = null

  global.Page = (config) => {
    definition = config
  }
  global.getApp = () => ({ globalData: {} })
  global.wx = {
    getStorageSync: () => '',
    setStorageSync: () => {},
    removeStorageSync: () => {},
  }

  delete require.cache[absolutePath]
  require(absolutePath)

  global.Page = previousPage
  global.getApp = previousGetApp
  global.wx = previousWx

  return definition
}

function testCardDetailShareUsesVisitorMode() {
  const page = loadPageDefinition('pages/cardDetail/cardDetail.js')
  const result = page.onShareAppMessage.call({
    data: { card: { id: 'card_123', name: '张三', role: '产品经理' } },
    currentShareCard: null,
  })

  assert.strictEqual(
    result.path,
    '/pages/cardDetail/cardDetail?id=card_123&visitor=1',
    'cardDetail 分享路径应进入 visitor 模式'
  )
}

function testQrcodeShareUsesVisitorMode() {
  const page = loadPageDefinition('pages/qrcode/qrcode.js')
  const result = page.onShareAppMessage.call({
    data: {
      card: { id: 'card_456', name: '李四', role: '独立开发者' },
      sharePath: '/pages/cardDetail/cardDetail?id=card_456&visitor=1',
    },
  })

  assert.strictEqual(
    result.path,
    '/pages/cardDetail/cardDetail?id=card_456&visitor=1',
    'qrcode 分享路径应进入 visitor 模式'
  )
}

function main() {
  testCardDetailShareUsesVisitorMode()
  testQrcodeShareUsesVisitorMode()
  console.log('share path tests passed')
}

main()