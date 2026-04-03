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

function createPageContext(definition) {
  return {
    ...definition,
    data: JSON.parse(JSON.stringify(definition.data)),
    setData(update) {
      this.data = { ...this.data, ...update }
    },
  }
}

async function testVisitorPageSupportsTodayAndWeekFilters() {
  const now = new Date('2026-04-03T10:00:00.000Z')
  const today = new Date('2026-04-03T08:00:00.000Z').toISOString()
  const thisWeek = new Date('2026-04-01T08:00:00.000Z').toISOString()
  const lastWeek = new Date('2026-03-25T08:00:00.000Z').toISOString()

  const visitorServicePath = mockModule('services/visitorService.js', {
    getVisitorsAsync: async () => ({
      visitors: [
        { _id: 'visitor_1', name: '苏晨', role: '增长顾问', source: '微信分享', visitDate: today, visitTimeText: '刚刚' },
        { _id: 'visitor_2', name: '林知远', role: '产品经理', source: '二维码访问', visitDate: thisWeek, visitTimeText: '本周三' },
        { _id: 'visitor_3', name: '赵一帆', role: 'Flutter 开发', source: '名片分享', visitDate: lastWeek, visitTimeText: '上周' },
      ],
    }),
  })
  const userServicePath = mockModule('services/userService.js', {
    bootstrapSessionAsync: async () => ({ success: true }),
  })

  let navigatedUrl = ''
  const originalDate = global.Date
  global.Date = class MockDate extends Date {
    constructor(...args) {
      if (args.length) {
        super(...args)
        return
      }
      super(now.toISOString())
    }
    static now() {
      return now.getTime()
    }
  }

  global.wx = {
    showToast: () => {},
    navigateTo: ({ url }) => {
      navigatedUrl = url
    },
  }

  const { definition, absolutePath } = loadPageDefinition('pages/visitor/visitor.js')
  const ctx = createPageContext(definition)

  definition.onLoad.call(ctx)
  await definition.loadVisitors.call(ctx)

  assert.strictEqual(ctx.data.visitors.length, 3, '默认应展示全部访客')

  definition.switchTab.call(ctx, { currentTarget: { dataset: { tab: 'today' } } })
  assert.strictEqual(ctx.data.visitors.length, 1, '今日筛选应只保留今天的访客')
  assert.strictEqual(ctx.data.visitors[0].name, '苏晨')

  definition.switchTab.call(ctx, { currentTarget: { dataset: { tab: 'week' } } })
  assert.strictEqual(ctx.data.visitors.length, 2, '本周筛选应保留本周访客')
  assert.ok(ctx.data.visitors.some((item) => item.name === '苏晨'))
  assert.ok(ctx.data.visitors.some((item) => item.name === '林知远'))

  definition.exchangeCard.call(ctx, { currentTarget: { dataset: { id: 'visitor_2' } } })
  assert.strictEqual(navigatedUrl, '/pages/exchangeconfirm/exchangeconfirm?id=visitor_2')

  global.Date = originalDate
  ;[absolutePath, visitorServicePath, userServicePath].forEach((moduleId) => {
    delete require.cache[moduleId]
  })
}

async function main() {
  await testVisitorPageSupportsTodayAndWeekFilters()
  console.log('visitor page tests passed')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
