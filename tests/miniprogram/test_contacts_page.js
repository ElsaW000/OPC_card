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

async function testContactsPageSupportsStarFilterAndPendingActions() {
  let contactState = {
    contacts: [
      {
        _id: 'contact_1',
        cardId: 'card_1',
        name: '林知远',
        role: '产品经理',
        company: 'Morning Labs',
        tags: ['AI', '产品'],
        starred: true,
        latestInteractionText: '昨天交换了名片',
      },
      {
        _id: 'contact_2',
        cardId: 'card_2',
        name: '苏念',
        role: '增长负责人',
        company: 'Wave Studio',
        tags: ['增长'],
        starred: false,
        latestInteractionText: '本周有新动态',
      },
    ],
    pendingRequests: [
      {
        _id: 'contact_pending_1',
        cardId: 'card_3',
        name: '赵一帆',
        role: 'Flutter 开发',
        company: 'Indie Works',
        tags: ['Flutter'],
        starred: false,
        status: 'pending',
        latestInteractionText: '收到交换名片请求',
      },
    ],
    tags: ['全部', 'AI', '增长', 'Flutter'],
  }

  const contactServicePath = mockModule('services/contactService.js', {
    getContactsAsync: async () => JSON.parse(JSON.stringify(contactState)),
    updateContactAsync: async (id, action) => {
      if (id === 'contact_1' && action === 'toggleStar') {
        contactState = {
          ...contactState,
          contacts: contactState.contacts.map((item) => item._id === id ? { ...item, starred: !item.starred } : item),
        }
      }
      return { success: true }
    },
    approveContactAsync: async (id) => {
      if (id === 'contact_pending_1') {
        const pending = contactState.pendingRequests.find((item) => item._id === id)
        contactState = {
          ...contactState,
          contacts: contactState.contacts.concat([{ ...pending, status: 'active' }]),
          pendingRequests: contactState.pendingRequests.filter((item) => item._id !== id),
        }
      }
      return { success: true }
    },
    rejectContactAsync: async (id) => {
      contactState = {
        ...contactState,
        pendingRequests: contactState.pendingRequests.filter((item) => item._id !== id),
      }
      return { success: true }
    },
  })
  const userServicePath = mockModule('services/userService.js', {
    bootstrapSessionAsync: async () => ({ success: true }),
    getSessionState: () => ({ status: 'local_ready', message: '当前展示本地联系人' }),
  })

  const toastCalls = []
  const storage = new Map([['contacts_initial_filter', 'starred']])
  global.wx = {
    getStorageSync: (key) => storage.get(key),
    removeStorageSync: (key) => storage.delete(key),
    showToast: (options) => toastCalls.push(options),
    navigateTo: () => {},
  }

  const { definition, absolutePath } = loadPageDefinition('pages/contacts/contacts.js')
  const ctx = createPageContext(definition)

  definition.onLoad.call(ctx, {})
  await definition.loadContacts.call(ctx)

  assert.strictEqual(ctx.data.activeTag, '★', '通过工作台进入联系人页时应默认切到星标筛选')
  assert.strictEqual(ctx.data.filteredContacts.length, 1, '星标筛选下只展示星标联系人')
  assert.strictEqual(ctx.data.filteredContacts[0].name, '林知远')
  assert.ok(ctx.data.pendingRequests.some((item) => item.name === '赵一帆'), '应展示待处理请求')

  await definition.approveRequest.call(ctx, { currentTarget: { dataset: { id: 'contact_pending_1' } } })

  assert.ok(toastCalls.some((item) => item.title === '已同意'), '同意请求后应提示成功')
  assert.strictEqual(ctx.data.pendingRequests.length, 0, '同意后待处理请求应移除')

  definition.selectTag.call(ctx, { currentTarget: { dataset: { tag: '全部' } } })
  assert.ok(ctx.data.filteredContacts.some((item) => item.name === '赵一帆'), '同意后联系人应进入联系人列表')

  await definition.toggleStar.call(ctx, { currentTarget: { dataset: { id: 'contact_1' } } })
  definition.selectTag.call(ctx, { currentTarget: { dataset: { tag: '★' } } })

  assert.strictEqual(ctx.data.filteredContacts.length, 0, '取消星标后不应继续出现在星标筛选中')

  ;[absolutePath, contactServicePath, userServicePath].forEach((moduleId) => {
    delete require.cache[moduleId]
  })
}

async function main() {
  await testContactsPageSupportsStarFilterAndPendingActions()
  console.log('contacts page tests passed')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
