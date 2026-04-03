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

function cleanup(paths) {
  paths.forEach((moduleId) => {
    delete require.cache[moduleId]
  })
}

async function testCardsFallbackToLocalWithoutAuthenticatedRemoteSession() {
  let requestCalls = 0

  const apiConfigPath = mockModule('services/apiConfig.js', {
    isRemoteApiEnabled: () => true,
    allowsLocalMockFallback: () => true,
  })
  const httpClientPath = mockModule('services/httpClient.js', {
    request: async () => {
      requestCalls += 1
      return { items: [] }
    },
  })
  const userServicePath = mockModule('services/userService.js', {
    getCurrentUser: () => ({ userId: 'local_user_1' }),
    hasAuthenticatedRemoteSession: () => false,
  })
  const mockDatabasePath = mockModule('services/mockDatabase.js', {
    readDatabase: () => ({
      currentUser: { userId: 'local_user_1' },
      cards: [
        { _id: 'card_1', userId: 'local_user_1', isDefault: true, name: '本地名片' },
      ],
    }),
    updateDatabase: (updater) => updater({
      currentUser: { userId: 'local_user_1' },
      cards: [],
    }),
    uid: () => 'card_x',
    nowIso: () => '2026-04-02T00:00:00.000Z',
  })

  const servicePath = path.resolve('services/cardService.js')
  delete require.cache[servicePath]
  const cardService = require(servicePath)

  const result = await cardService.getCardsAsync()

  assert.strictEqual(result.mode, 'local-storage')
  assert.strictEqual(requestCalls, 0, 'missing remote session should not request /cards')
  assert.strictEqual(result.defaultCard && result.defaultCard._id, 'card_1')

  cleanup([servicePath, apiConfigPath, httpClientPath, userServicePath, mockDatabasePath])
}

async function testCardsDoNotFallbackToLocalInStagingWithoutAuthenticatedRemoteSession() {
  let requestCalls = 0

  const apiConfigPath = mockModule('services/apiConfig.js', {
    isRemoteApiEnabled: () => true,
    allowsLocalMockFallback: () => false,
  })
  const httpClientPath = mockModule('services/httpClient.js', {
    request: async () => {
      requestCalls += 1
      return { items: [] }
    },
  })
  const userServicePath = mockModule('services/userService.js', {
    getCurrentUser: () => ({ userId: 'local_user_1' }),
    hasAuthenticatedRemoteSession: () => false,
  })
  const mockDatabasePath = mockModule('services/mockDatabase.js', {
    readDatabase: () => ({
      currentUser: { userId: 'local_user_1' },
      cards: [
        { _id: 'card_1', userId: 'local_user_1', isDefault: true, name: '本地名片' },
      ],
    }),
    updateDatabase: (updater) => updater({
      currentUser: { userId: 'local_user_1' },
      cards: [],
    }),
    uid: () => 'card_x',
    nowIso: () => '2026-04-03T00:00:00.000Z',
  })

  const servicePath = path.resolve('services/cardService.js')
  delete require.cache[servicePath]
  const cardService = require(servicePath)

  const result = await cardService.getCardsAsync()

  assert.strictEqual(result.mode, 'remote-unavailable')
  assert.strictEqual(result.success, false)
  assert.strictEqual(result.defaultCard, null)
  assert.strictEqual(Array.isArray(result.data), true)
  assert.strictEqual(result.data.length, 0)
  assert.strictEqual(requestCalls, 0, 'staging missing remote session should still avoid /cards request')

  cleanup([servicePath, apiConfigPath, httpClientPath, userServicePath, mockDatabasePath])
}

async function testContactsFallbackToLocalWithoutAuthenticatedRemoteSession() {
  let requestCalls = 0

  const apiConfigPath = mockModule('services/apiConfig.js', {
    isRemoteApiEnabled: () => true,
    allowsLocalMockFallback: () => true,
  })
  const httpClientPath = mockModule('services/httpClient.js', {
    request: async () => {
      requestCalls += 1
      return { contacts: [] }
    },
  })
  const userServicePath = mockModule('services/userService.js', {
    getCurrentUser: () => ({ userId: 'local_user_1' }),
    hasAuthenticatedRemoteSession: () => false,
  })
  const mockDatabasePath = mockModule('services/mockDatabase.js', {
    readDatabase: () => ({
      currentUser: { userId: 'local_user_1' },
      contacts: [
        {
          _id: 'contact_1',
          ownerUserId: 'local_user_1',
          name: '本地联系人',
          status: 'active',
          tags: ['AI'],
        },
      ],
    }),
    updateDatabase: (updater) => updater({
      currentUser: { userId: 'local_user_1' },
      contacts: [],
    }),
    nowIso: () => '2026-04-02T00:00:00.000Z',
    uid: () => 'contact_x',
  })

  const servicePath = path.resolve('services/contactService.js')
  delete require.cache[servicePath]
  const contactService = require(servicePath)

  const result = await contactService.getContactsAsync()

  assert.strictEqual(result.mode, 'local-storage')
  assert.strictEqual(requestCalls, 0, 'missing remote session should not request /contacts')
  assert.strictEqual(result.contacts.length, 1)

  cleanup([servicePath, apiConfigPath, httpClientPath, userServicePath, mockDatabasePath])
}

async function testWorkbenchFallsBackToLocalWithoutAuthenticatedRemoteSession() {
  let requestCalls = 0

  const apiConfigPath = mockModule('services/apiConfig.js', {
    isRemoteApiEnabled: () => true,
    allowsLocalMockFallback: () => true,
  })
  const httpClientPath = mockModule('services/httpClient.js', {
    request: async () => {
      requestCalls += 1
      return {}
    },
  })
  const userServicePath = mockModule('services/userService.js', {
    getCurrentUser: () => ({ userId: 'local_user_1' }),
    hasAuthenticatedRemoteSession: () => false,
  })
  const cardServicePath = mockModule('services/cardService.js', {
    getCards: () => ({
      data: [{ _id: 'card_1', isDefault: true, name: '本地名片', role: '产品', company: 'eSeat' }],
      defaultCard: { _id: 'card_1', isDefault: true, name: '本地名片', role: '产品', company: 'eSeat' },
    }),
    getCardsAsync: async () => ({ data: [], defaultCard: null }),
  })
  const visitorServicePath = mockModule('services/visitorService.js', {
    getVisitors: () => ({ visitors: [] }),
    getVisitorsAsync: async () => ({ visitors: [] }),
  })
  const contactServicePath = mockModule('services/contactService.js', {
    getContacts: () => ({ contacts: [{ _id: 'contact_1', name: '本地联系人', starred: true, tags: ['AI'] }] }),
    getContactsAsync: async () => ({ contacts: [] }),
  })
  const settingsServicePath = mockModule('services/settingsService.js', {
    readSettings: () => ({
      aiTone: '专业且友好',
      publicDynamics: true,
      privacyMode: '交换后可见',
      blacklist: [],
    }),
  })

  const servicePath = path.resolve('services/workbenchService.js')
  delete require.cache[servicePath]
  const workbenchService = require(servicePath)

  const result = await workbenchService.getWorkbenchAsync()

  assert.strictEqual(result.mode, 'local-storage')
  assert.strictEqual(requestCalls, 0, 'missing remote session should not request /workbench')
  assert.strictEqual(Array.isArray(result.starredContacts), true)
  assert.strictEqual(result.starredContacts.length, 1)

  cleanup([
    servicePath,
    apiConfigPath,
    httpClientPath,
    userServicePath,
    cardServicePath,
    visitorServicePath,
    contactServicePath,
    settingsServicePath,
  ])
}

async function main() {
  await testCardsFallbackToLocalWithoutAuthenticatedRemoteSession()
  await testCardsDoNotFallbackToLocalInStagingWithoutAuthenticatedRemoteSession()
  await testContactsFallbackToLocalWithoutAuthenticatedRemoteSession()
  await testWorkbenchFallsBackToLocalWithoutAuthenticatedRemoteSession()
  console.log('protected remote guard tests passed')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
