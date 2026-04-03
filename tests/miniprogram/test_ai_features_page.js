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
  const originalSetTimeout = global.setTimeout
  const originalClearTimeout = global.clearTimeout

  global.setTimeout = (fn, delay) => {
    const timer = { id: nextId++, fn, delay, cleared: false }
    timers.push(timer)
    return timer.id
  }

  global.clearTimeout = (id) => {
    const timer = timers.find((item) => item.id === id)
    if (timer) timer.cleared = true
  }

  return {
    run(delay) {
      timers
        .filter((timer) => timer.delay === delay && !timer.cleared)
        .forEach((timer) => {
          timer.cleared = true
          timer.fn()
        })
    },
    restore() {
      global.setTimeout = originalSetTimeout
      global.clearTimeout = originalClearTimeout
    },
  }
}

function createPageContext(definition, data = {}) {
  return {
    ...definition,
    data: {
      messages: [],
      inputText: '',
      loading: false,
      loadingStatusText: '',
      slowHintVisible: false,
      perfInfo: null,
      ...data,
    },
    setData(update, callback) {
      this.data = { ...this.data, ...update }
      if (typeof callback === 'function') callback()
    },
  }
}

async function flushMicrotasks() {
  await Promise.resolve()
  await Promise.resolve()
  await new Promise((resolve) => setImmediate(resolve))
}

async function testOnLoadPrewarmsRemoteSession() {
  let setRemoteCalled = false
  let bootstrapCalled = false

  const aiServicePath = mockModule('services/aiService.js', {
    generateAI: async () => ({ success: true, result: { reply: 'remote reply' } }),
    getAIProvider: () => 'qwen',
    setAIProvider: () => 'qwen',
  })
  const userServicePath = mockModule('services/userService.js', {
    bootstrapSessionAsync: async () => {
      bootstrapCalled = true
      return { success: true }
    },
  })
  const apiConfigPath = mockModule('services/apiConfig.js', {
    isRemoteApiEnabled: () => false,
    setRemoteApiEnabled: (enabled) => {
      setRemoteCalled = enabled
    },
  })
  const settingsServicePath = mockModule('services/settingsService.js', {
    readSettings: () => ({ allowAiContactsContext: false }),
  })
  const httpClientPath = mockModule('services/httpClient.js', {
    request: async () => ({ success: true }),
  })

  global.wx = {
    showToast: () => {},
  }

  const { definition, absolutePath } = loadPageDefinition('pages/aiFeatures/aiFeatures.js')
  const ctx = createPageContext(definition)

  definition.onLoad.call(ctx)
  await flushMicrotasks()

  assert.strictEqual(setRemoteCalled, true, '进入 AI 页后应立即开启远程模式，提前预热')
  assert.strictEqual(bootstrapCalled, true, '进入 AI 页后应立即预热远程会话')

  ;[absolutePath, aiServicePath, userServicePath, apiConfigPath, settingsServicePath, httpClientPath].forEach((moduleId) => {
    delete require.cache[moduleId]
  })
}

async function testSendMessageEnablesRemoteAiWhenDisabled() {
  let setRemoteCalled = false
  let bootstrapCalled = false

  const aiServicePath = mockModule('services/aiService.js', {
    generateAI: async () => ({ success: true, result: { reply: 'remote reply' } }),
    getAIProvider: () => 'qwen',
    setAIProvider: () => 'qwen',
  })
  const userServicePath = mockModule('services/userService.js', {
    bootstrapSessionAsync: async () => {
      bootstrapCalled = true
      return { success: true }
    },
  })
  const apiConfigPath = mockModule('services/apiConfig.js', {
    isRemoteApiEnabled: () => false,
    setRemoteApiEnabled: () => {
      setRemoteCalled = true
    },
  })
  const settingsServicePath = mockModule('services/settingsService.js', {
    readSettings: () => ({ allowAiContactsContext: false }),
  })
  const httpClientPath = mockModule('services/httpClient.js', {
    request: async () => ({ success: true }),
  })

  global.wx = {
    showToast: () => {},
  }

  const { definition, absolutePath } = loadPageDefinition('pages/aiFeatures/aiFeatures.js')
  const ctx = createPageContext(definition, {
    inputText: '你好',
  })

  await definition.sendMessage.call(ctx)

  assert.strictEqual(setRemoteCalled, true, 'AI 聊天发送前应显式开启远程模式')
  assert.strictEqual(bootstrapCalled, true, 'AI 聊天发送前应先拉起远程会话')
  assert.strictEqual(ctx.data.messages[1].content, 'remote reply')

  ;[absolutePath, aiServicePath, userServicePath, apiConfigPath, settingsServicePath, httpClientPath].forEach((moduleId) => {
    delete require.cache[moduleId]
  })
}

async function testSendMessageShowsProgressiveFeedbackAndCapturesTrace() {
  let resolveReply = null
  const timerHarness = createTimerHarness()

  const aiServicePath = mockModule('services/aiService.js', {
    generateAI: () => new Promise((resolve) => {
      resolveReply = resolve
    }),
    getAIProvider: () => 'qwen',
    setAIProvider: () => 'qwen',
  })
  const userServicePath = mockModule('services/userService.js', {
    bootstrapSessionAsync: async () => ({ success: true }),
  })
  const apiConfigPath = mockModule('services/apiConfig.js', {
    isRemoteApiEnabled: () => true,
    setRemoteApiEnabled: () => {},
  })
  const settingsServicePath = mockModule('services/settingsService.js', {
    readSettings: () => ({ allowAiContactsContext: false }),
  })
  const httpClientPath = mockModule('services/httpClient.js', {
    request: async () => ({ success: true }),
  })

  global.wx = {
    showToast: () => {},
  }

  const originalDateNow = Date.now
  Date.now = (() => {
    let current = 1000
    return () => {
      current += 25
      return current
    }
  })()

  const { definition, absolutePath } = loadPageDefinition('pages/aiFeatures/aiFeatures.js')
  const ctx = createPageContext(definition, {
    inputText: '请帮我优化简介',
  })

  await ctx._ensureAiReady()

  const sendPromise = definition.sendMessage.call(ctx)

  assert.strictEqual(ctx.data.loadingStatusText, '正在思考', '发送后应立即给出思考反馈')

  timerHarness.run(3000)
  assert.strictEqual(ctx.data.loadingStatusText, '正在整理你的问题', '超过 3 秒后应给出更自然的等待提示')

  timerHarness.run(12000)
  assert.strictEqual(ctx.data.loadingStatusText, '正在整理更合适的建议，可能还需要几秒', '超过 12 秒后应提示正在继续思考')

  timerHarness.run(20000)
  assert.strictEqual(ctx.data.loadingStatusText, '还在继续思考，如果你赶时间，我也可以先给你一个简短建议', '超过 20 秒后再提示可以先给简版建议')

  await flushMicrotasks()
  assert.strictEqual(typeof resolveReply, 'function', '预热完成后应真正发起远程 AI 请求')

  resolveReply({
    success: true,
    result: { reply: 'remote reply' },
    meta: {
      trace: {
        traceId: 'trace-1',
        frontendClickedAtMs: 1025,
        backendReceivedAtMs: 1100,
        modelRequestStartedAtMs: 1180,
        modelFirstByteAtMs: 1500,
        backendReturnedAtMs: 1650,
      },
    },
  })
  await sendPromise

  assert.strictEqual(ctx.data.loading, false)
  assert.strictEqual(ctx.data.loadingStatusText, '')
  assert.ok(ctx.data.perfInfo, '请求完成后应保留本次链路耗时信息')
  assert.strictEqual(ctx.data.perfInfo.traceId, 'trace-1')
  assert.ok(ctx.data.perfInfo.frontendResponseReceivedAtMs <= ctx.data.perfInfo.frontendRenderedAtMs, '应记录前端收到响应后的渲染完成时间')
  assert.ok(ctx.data.perfInfo.frontendRenderMs >= 0, '前端渲染耗时应基于前端本地时钟计算')

  Date.now = originalDateNow
  timerHarness.restore()

  ;[absolutePath, aiServicePath, userServicePath, apiConfigPath, settingsServicePath, httpClientPath].forEach((moduleId) => {
    delete require.cache[moduleId]
  })
}

async function testSendMessagePassesContactsAuthorization() {
  const requests = []
  const aiServicePath = mockModule('services/aiService.js', {
    generateAI: async (type, payload) => {
      requests.push({ type, payload })
      return { success: true, result: { reply: 'remote reply' } }
    },
    getAIProvider: () => 'qwen',
    setAIProvider: () => 'qwen',
  })
  const userServicePath = mockModule('services/userService.js', {
    bootstrapSessionAsync: async () => ({ success: true }),
  })
  const apiConfigPath = mockModule('services/apiConfig.js', {
    isRemoteApiEnabled: () => true,
    setRemoteApiEnabled: () => {},
  })
  const settingsServicePath = mockModule('services/settingsService.js', {
    readSettings: () => ({ allowAiContactsContext: true }),
  })

  global.wx = {
    showToast: () => {},
  }

  const { definition, absolutePath } = loadPageDefinition('pages/aiFeatures/aiFeatures.js')
  const ctx = createPageContext(definition, {
    inputText: '帮我推荐合作人',
    contactsContextEnabled: true,
  })

  await definition.sendMessage.call(ctx)

  assert.strictEqual(requests.length, 1)
  assert.strictEqual(requests[0].payload.allowContactsContext, true, '显式授权后应把联系人上下文权限传给 AI')

  ;[absolutePath, aiServicePath, userServicePath, apiConfigPath, settingsServicePath, httpClientPath].forEach((moduleId) => {
    delete require.cache[moduleId]
  })
}

async function testAiPageSyncsLocalContactsAuthorizationToBackend() {
  const requests = []
  const aiServicePath = mockModule('services/aiService.js', {
    generateAI: async () => ({ success: true, result: { reply: 'remote reply' } }),
    getAIProvider: () => 'qwen',
    setAIProvider: () => 'qwen',
  })
  const userServicePath = mockModule('services/userService.js', {
    bootstrapSessionAsync: async () => ({ success: true }),
    getCurrentUser: () => ({ userId: 'remote_user_1' }),
    hasAuthenticatedRemoteSession: () => true,
  })
  const apiConfigPath = mockModule('services/apiConfig.js', {
    isRemoteApiEnabled: () => true,
    setRemoteApiEnabled: () => {},
  })
  const settingsServicePath = mockModule('services/settingsService.js', {
    readSettings: () => ({ allowAiContactsContext: true }),
  })
  const httpClientPath = mockModule('services/httpClient.js', {
    request: async (payload) => {
      requests.push(payload)
      return { success: true }
    },
  })

  global.wx = {
    showToast: () => {},
  }

  const { definition, absolutePath } = loadPageDefinition('pages/aiFeatures/aiFeatures.js')
  const ctx = createPageContext(definition)

  definition.onLoad.call(ctx)
  await flushMicrotasks()

  assert.strictEqual(requests.length, 1)
  assert.strictEqual(requests[0].url, '/auth/settings')
  assert.deepStrictEqual(requests[0].data, { allow_ai_contacts_context: true })

  ;[absolutePath, aiServicePath, userServicePath, apiConfigPath, settingsServicePath, httpClientPath].forEach((moduleId) => {
    delete require.cache[moduleId]
  })
}

async function testSendMessageShowsContactsContextUsage() {
  const aiServicePath = mockModule('services/aiService.js', {
    generateAI: async () => ({
      success: true,
      result: { reply: '推荐林知远，他的 AI 标签与你的需求更匹配。' },
      meta: {
        replySource: 'model',
        modelAnswered: true,
        contactsContextUsed: true,
        trace: { traceId: 'trace-ctx-1', frontendClickedAtMs: 1000 },
      },
    }),
    getAIProvider: () => 'qwen',
    setAIProvider: () => 'qwen',
  })
  const userServicePath = mockModule('services/userService.js', {
    bootstrapSessionAsync: async () => ({ success: true }),
    getCurrentUser: () => ({ userId: 'remote_user_1' }),
    hasAuthenticatedRemoteSession: () => true,
  })
  const apiConfigPath = mockModule('services/apiConfig.js', {
    isRemoteApiEnabled: () => true,
    setRemoteApiEnabled: () => {},
  })
  const settingsServicePath = mockModule('services/settingsService.js', {
    readSettings: () => ({ allowAiContactsContext: true }),
  })
  const httpClientPath = mockModule('services/httpClient.js', {
    request: async () => ({ success: true }),
  })

  global.wx = {
    showToast: () => {},
  }

  const { definition, absolutePath } = loadPageDefinition('pages/aiFeatures/aiFeatures.js')
  const ctx = createPageContext(definition, {
    inputText: '帮我推荐一个ai方向的人',
    contactsContextEnabled: true,
  })

  await definition.sendMessage.call(ctx)

  assert.strictEqual(ctx.data.contactsContextStatusText, '联系人上下文已接入')

  ;[absolutePath, aiServicePath, userServicePath, apiConfigPath, settingsServicePath, httpClientPath].forEach((moduleId) => {
    delete require.cache[moduleId]
  })
}

async function testAssistantReplyStreamsIntoBubble() {
  const timerHarness = createTimerHarness()
  const aiServicePath = mockModule('services/aiService.js', {
    generateAI: async () => ({ success: true, result: { reply: '这是一个较长的回复，用来验证逐段输出效果。' } }),
    getAIProvider: () => 'qwen',
    setAIProvider: () => 'qwen',
  })
  const userServicePath = mockModule('services/userService.js', {
    bootstrapSessionAsync: async () => ({ success: true }),
  })
  const apiConfigPath = mockModule('services/apiConfig.js', {
    isRemoteApiEnabled: () => true,
    setRemoteApiEnabled: () => {},
  })
  const settingsServicePath = mockModule('services/settingsService.js', {
    readSettings: () => ({ allowAiContactsContext: false }),
  })
  const httpClientPath = mockModule('services/httpClient.js', {
    request: async () => ({ success: true }),
  })

  global.wx = {
    showToast: () => {},
  }

  const { definition, absolutePath } = loadPageDefinition('pages/aiFeatures/aiFeatures.js')
  const ctx = createPageContext(definition, {
    inputText: '给我一个较长回答',
  })

  const sendPromise = definition.sendMessage.call(ctx)
  await flushMicrotasks()
  timerHarness.run(32)

  const assistantMessage = ctx.data.messages[ctx.data.messages.length - 1]
  assert.ok(assistantMessage.content.length > 0, '回复开始后应先看到部分内容')
  assert.notStrictEqual(assistantMessage.content, '这是一个较长的回复，用来验证逐段输出效果。', '回复不应一次性整块出现')

  for (let i = 0; i < 20; i += 1) {
    timerHarness.run(32)
  }
  await sendPromise

  const finalAssistantMessage = ctx.data.messages[ctx.data.messages.length - 1]
  assert.strictEqual(finalAssistantMessage.content, '这是一个较长的回复，用来验证逐段输出效果。')

  timerHarness.restore()
  ;[absolutePath, aiServicePath, userServicePath, apiConfigPath, settingsServicePath, httpClientPath].forEach((moduleId) => {
    delete require.cache[moduleId]
  })
}

async function testUnloadStopsAsyncUpdates() {
  let resolveReply = null
  const aiServicePath = mockModule('services/aiService.js', {
    generateAI: () => new Promise((resolve) => {
      resolveReply = resolve
    }),
    getAIProvider: () => 'qwen',
    setAIProvider: () => 'qwen',
  })
  const userServicePath = mockModule('services/userService.js', {
    bootstrapSessionAsync: async () => ({ success: true }),
  })
  const apiConfigPath = mockModule('services/apiConfig.js', {
    isRemoteApiEnabled: () => true,
    setRemoteApiEnabled: () => {},
  })
  const settingsServicePath = mockModule('services/settingsService.js', {
    readSettings: () => ({ allowAiContactsContext: false }),
  })
  const httpClientPath = mockModule('services/httpClient.js', {
    request: async () => ({ success: true }),
  })

  global.wx = {
    showToast: () => {},
  }

  const { definition, absolutePath } = loadPageDefinition('pages/aiFeatures/aiFeatures.js')
  let setDataAfterUnload = false
  const ctx = createPageContext(definition, {
    inputText: '卸载时不要再更新',
  })
  const originalSetData = ctx.setData
  ctx.setData = function setDataGuard(update, callback) {
    if (this._destroyed) {
      setDataAfterUnload = true
    }
    return originalSetData.call(this, update, callback)
  }

  const sendPromise = definition.sendMessage.call(ctx)
  await flushMicrotasks()
  definition.onUnload.call(ctx)
  resolveReply({ success: true, result: { reply: 'reply after unload' } })
  await sendPromise

  assert.strictEqual(setDataAfterUnload, false, '页面卸载后不应继续 setData，避免框架空对象报错')

  ;[absolutePath, aiServicePath, userServicePath, apiConfigPath, settingsServicePath, httpClientPath].forEach((moduleId) => {
    delete require.cache[moduleId]
  })
}

async function testChatUsesLongerRemoteTimeout() {
  const requests = []
  const absoluteHttpClientPath = path.resolve('services/httpClient.js')
  delete require.cache[absoluteHttpClientPath]

  global.wx = {
    request(options) {
      requests.push(options)
      options.success({
        statusCode: 200,
        data: { success: true, result: { reply: 'remote reply' } },
      })
    },
    getStorageSync: () => '',
  }

  const userServicePath = mockModule('services/userService.js', {
    getCurrentUser: () => ({ userId: 'remote_user_1' }),
  })
  const apiConfigPath = mockModule('services/apiConfig.js', {
    isRemoteApiEnabled: () => true,
    getApiBaseUrl: () => 'http://127.0.0.1:8004/api/v1',
  })
  const errorUtilsPath = mockModule('services/errorUtils.js', {
    normalizeError: (error) => error,
  })

  delete require.cache[path.resolve('services/aiService.js')]
  const aiService = require(path.resolve('services/aiService.js'))
  await aiService.generateAI('chat', { message: '你好' })

  assert.strictEqual(requests.length, 1)
  assert.strictEqual(requests[0].timeout, 25000, 'chat 请求应单独放宽到 25 秒超时')

  ;[path.resolve('services/aiService.js'), absoluteHttpClientPath, userServicePath, apiConfigPath, errorUtilsPath].forEach((moduleId) => {
    delete require.cache[moduleId]
  })
}

async function main() {
  await testOnLoadPrewarmsRemoteSession()
  await testSendMessageEnablesRemoteAiWhenDisabled()
  await testSendMessageShowsProgressiveFeedbackAndCapturesTrace()
  await testSendMessagePassesContactsAuthorization()
  await testAiPageSyncsLocalContactsAuthorizationToBackend()
  await testSendMessageShowsContactsContextUsage()
  await testAssistantReplyStreamsIntoBubble()
  await testUnloadStopsAsyncUpdates()
  await testChatUsesLongerRemoteTimeout()
  console.log('ai features page tests passed')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
