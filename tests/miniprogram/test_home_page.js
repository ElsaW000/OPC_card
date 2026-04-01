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

async function testLoadWorkbenchFallsBackToLocalWhenRemoteTimeout() {
  let remoteEnabled = true
  let disableRemoteCalled = false
  let toastTitle = ''

  const workbenchServicePath = mockModule('services/workbenchService.js', {
    getWorkbenchAsync: async () => ({
      weeklyViews: 12,
      personaTags: [{ label: 'AI', size: 120 }],
      starredContacts: [{ name: '林知远', role: '产品', company: '壹席' }],
      settingsSummary: { aiTone: '专业且友好', publicDynamics: true, privacyMode: '交换后可见', blacklistCount: 0 },
    }),
  })
  const userServicePath = mockModule('services/userService.js', {
    bootstrapSessionAsync: async () => {
      throw { message: 'request:fail timeout' }
    },
  })
  const settingsServicePath = mockModule('services/settingsService.js', {
    updateSettings: (s) => s,
    addSuggestion: () => {},
    readSettings: () => ({ aiTone: '专业且友好', publicDynamics: true, privacyMode: '交换后可见', blacklistCount: 0 }),
  })
  const apiConfigPath = mockModule('services/apiConfig.js', {
    isRemoteApiEnabled: () => remoteEnabled,
    setRemoteApiEnabled: (enabled) => {
      remoteEnabled = enabled
      if (!enabled) disableRemoteCalled = true
    },
  })

  global.wx = {
    showToast: ({ title }) => {
      toastTitle = title
    },
    navigateTo: () => {},
    switchTab: () => {},
    setStorageSync: () => {},
  }

  const { definition, absolutePath } = loadPageDefinition('pages/home/home.js')
  const ctx = {
    ...definition,
    data: JSON.parse(JSON.stringify(definition.data)),
    setData(update) {
      this.data = { ...this.data, ...update }
    },
  }

  await definition.loadWorkbench.call(ctx)

  assert.strictEqual(disableRemoteCalled, true, '远程超时时应自动切回本地模式')
  assert.strictEqual(ctx.data.weeklyViews, 12, '切回本地后应继续展示工作台数据')
  assert.strictEqual(toastTitle, '远程超时，已切换本地模式', '应给出明确降级提示')

  ;[absolutePath, workbenchServicePath, userServicePath, settingsServicePath, apiConfigPath].forEach((moduleId) => {
    delete require.cache[moduleId]
  })
}

async function main() {
  await testLoadWorkbenchFallsBackToLocalWhenRemoteTimeout()
  console.log('home page tests passed')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})