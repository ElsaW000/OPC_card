const assert = require('assert')
const path = require('path')

async function main() {
  const storage = new Map()
  global.wx = {
    getStorageSync: (key) => storage.get(key),
    setStorageSync: (key, value) => storage.set(key, value),
    removeStorageSync: (key) => storage.delete(key),
  }

  const projectRoot = process.cwd()
  const apiConfigPath = path.resolve(projectRoot, 'services/apiConfig.js')
  const userServicePath = path.resolve(projectRoot, 'services/userService.js')
  const contactServicePath = path.resolve(projectRoot, 'services/contactService.js')
  const cardServicePath = path.resolve(projectRoot, 'services/cardService.js')
  const mockDatabasePath = path.resolve(projectRoot, 'services/mockDatabase.js')

  delete require.cache[apiConfigPath]
  delete require.cache[userServicePath]
  delete require.cache[contactServicePath]
  delete require.cache[cardServicePath]
  delete require.cache[mockDatabasePath]

  const contactService = require(contactServicePath)
  const cardService = require(cardServicePath)

  const contactsResult = contactService.getContacts()
  const defaultCardResult = cardService.getCard()

  assert.strictEqual(contactsResult.success, true)
  assert.strictEqual(defaultCardResult.success, true)
  assert.ok(defaultCardResult.data && defaultCardResult.data._id, '应存在默认名片')

  const activeContact = contactsResult.contacts.find((item) => item.status === 'active')
  const pendingContact = contactsResult.pendingRequests.find((item) => item.status === 'pending')

  assert.ok(activeContact && activeContact.cardId, '应存在可查看的联系人名片')
  assert.ok(pendingContact && pendingContact.cardId, '待处理请求也应带申请人的名片 ID')
  assert.notStrictEqual(activeContact.cardId, defaultCardResult.data._id, '联系人名片不应退化成默认名片')
  assert.notStrictEqual(pendingContact.cardId, defaultCardResult.data._id, '待处理申请人的名片不应退化成默认名片')

  const activeCardView = cardService.getCardView(activeContact.cardId, '联系人页', false, true)
  const pendingCardView = cardService.getCardView(pendingContact.cardId, '待处理请求', false, true)

  assert.strictEqual(activeCardView.success, true)
  assert.strictEqual(pendingCardView.success, true)
  assert.notStrictEqual(activeCardView.data.name, defaultCardResult.data.name, '联系人详情卡片应展示联系人自己的资料')
  assert.notStrictEqual(pendingCardView.data.name, defaultCardResult.data.name, '待处理申请人应展示申请人的资料')

  console.log('local contact card view tests passed')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
