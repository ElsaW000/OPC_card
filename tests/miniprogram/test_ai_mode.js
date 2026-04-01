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

async function testAiUsesLocalFallbackWhenRemoteDisabled() {
  const aiServicePath = path.resolve('services/aiService.js')
  let called = false
  const apiConfigPath = mockModule('services/apiConfig.js', {
    getApiBaseUrl: () => 'http://127.0.0.1:8004/api/v1',
    isRemoteApiEnabled: () => false,
  })
  const httpClientPath = mockModule('services/httpClient.js', {
    request: async () => {
      called = true
      throw new Error('request should not be called when remote mode is disabled')
    },
  })

  global.wx = {
    getStorageSync: () => '',
    setStorageSync: () => {},
  }

  delete require.cache[aiServicePath]
  const { generateAI } = require(aiServicePath)
  const result = await generateAI('chat', { message: '帮我优化简介' })

  assert.strictEqual(result.success, true)
  assert.strictEqual(called, false, 'remote mode off 时不应调用 request')
  assert.strictEqual(typeof result.result.reply, 'string')
  assert.ok(result.result.reply.includes('简介') || result.result.reply.includes('职业定位'))

  delete require.cache[aiServicePath]
  delete require.cache[apiConfigPath]
  delete require.cache[httpClientPath]
}

async function testAiUsesRemoteWhenEnabled() {
  const aiServicePath = path.resolve('services/aiService.js')
  let called = false
  const apiConfigPath = mockModule('services/apiConfig.js', {
    getApiBaseUrl: () => 'http://127.0.0.1:8004/api/v1',
    isRemoteApiEnabled: () => true,
  })
  const httpClientPath = mockModule('services/httpClient.js', {
    request: async () => {
      called = true
      return { success: true, result: { reply: 'remote ok' } }
    },
  })

  global.wx = {
    getStorageSync: () => '',
    setStorageSync: () => {},
  }

  delete require.cache[aiServicePath]
  const { generateAI } = require(aiServicePath)
  const result = await generateAI('chat', { message: 'hello' })

  assert.strictEqual(called, true)
  assert.strictEqual(result.result.reply, 'remote ok')

  delete require.cache[aiServicePath]
  delete require.cache[apiConfigPath]
  delete require.cache[httpClientPath]
}

async function main() {
  await testAiUsesLocalFallbackWhenRemoteDisabled()
  await testAiUsesRemoteWhenEnabled()
  console.log('ai mode tests passed')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})