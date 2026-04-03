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

async function main() {
  const cardServicePath = mockModule('services/cardService.js', {
    getCardsAsync: async () => ({
      data: [{ _id: 'card_1', title: '本地名片', name: '张三', isDefault: true }],
    }),
    setDefaultCardAsync: async () => ({ success: true }),
    deleteCardAsync: async () => ({ success: true }),
  })
  const userServicePath = mockModule('services/userService.js', {
    bootstrapSessionAsync: async () => ({
      success: true,
      sessionState: { status: 'remote_unavailable', message: '远程登录失败，当前使用本地数据' },
    }),
    getSessionState: () => ({ status: 'remote_unavailable', message: '远程登录失败，当前使用本地数据' }),
  })

  global.wx = {
    showToast: () => {},
    navigateTo: () => {},
    showModal: () => {},
  }

  const { definition, absolutePath } = loadPageDefinition('pages/mycards/mycards.js')
  const ctx = {
    ...definition,
    data: JSON.parse(JSON.stringify(definition.data)),
    setData(update) {
      this.data = { ...this.data, ...update }
    },
  }

  await definition.loadCards.call(ctx)

  assert.strictEqual(ctx.data.cards.length, 1)
  assert.strictEqual(ctx.data.sessionView.code, 'remote_unavailable')

  ;[absolutePath, cardServicePath, userServicePath].forEach((moduleId) => {
    delete require.cache[moduleId]
  })

  console.log('mycards page tests passed')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
