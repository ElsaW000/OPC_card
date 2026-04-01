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

async function main() {
  const projectRoot = process.cwd()
  const contactServicePath = path.resolve(projectRoot, 'services/contactService.js')
  const apiConfigPath = mockModule('services/apiConfig.js', {
    isRemoteApiEnabled: () => true,
  })
  const httpClientPath = mockModule('services/httpClient.js', {
    request: async () => ({
      contacts: [
        {
          _id: 'contact_active_1',
          cardId: 'card_remote_1',
          name: '张三',
          role: '产品经理',
          company: 'eSeat',
          phone: '13800000000',
        },
      ],
      pendingRequests: [
        {
          _id: 'contact_pending_1',
          cardId: 'card_remote_2',
          name: '李四',
          role: '独立开发者',
          status: 'pending',
        },
      ],
      updatedTips: [],
      tags: ['全部'],
    }),
  })
  const userServicePath = mockModule('services/userService.js', {
    getCurrentUser: () => ({ userId: 'user_remote_1' }),
  })

  delete require.cache[contactServicePath]
  const contactService = require(contactServicePath)

  assert.strictEqual(typeof contactService.getContactDetailAsync, 'function', '应暴露 getContactDetailAsync')

  const activeResult = await contactService.getContactDetailAsync('contact_active_1')
  assert.strictEqual(activeResult.success, true)
  assert.strictEqual(activeResult.data.cardId, 'card_remote_1')
  assert.strictEqual(activeResult.data.name, '张三')

  const pendingResult = await contactService.getContactDetailAsync('contact_pending_1')
  assert.strictEqual(pendingResult.success, true)
  assert.strictEqual(pendingResult.data.cardId, 'card_remote_2')
  assert.strictEqual(pendingResult.data.status, 'pending')

  const missingResult = await contactService.getContactDetailAsync('missing_contact')
  assert.strictEqual(missingResult.success, false)

  ;[contactServicePath, apiConfigPath, httpClientPath, userServicePath].forEach((moduleId) => {
    delete require.cache[moduleId]
  })

  console.log('contact detail service tests passed')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})