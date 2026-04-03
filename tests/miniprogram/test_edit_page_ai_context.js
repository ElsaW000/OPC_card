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

function createPageContext(definition, data = {}) {
  return {
    ...definition,
    data: {
      aiInput: '',
      name: '',
      role: '',
      company: '',
      bio: '',
      locationCountry: '',
      locationCity: '',
      years: '',
      techStack: '',
      business: '',
      cooperation: '',
      projects: [],
      customCards: [],
      ...data,
    },
    setData(update, callback) {
      this.data = { ...this.data, ...update }
      if (typeof callback === 'function') callback()
    },
  }
}

async function testGenerateFromAiPassesSelfProfileAndContactsAuthorization() {
  const requests = []
  global.getApp = () => ({ globalData: {} })
  global.wx = {
    showLoading: () => {},
    hideLoading: () => {},
    showToast: () => {},
  }

  const cardServicePath = mockModule('services/cardService.js', {
    saveCardAsync: async () => ({ success: true }),
    getCardViewAsync: async () => ({ success: true }),
  })
  const userServicePath = mockModule('services/userService.js', {
    bootstrapSessionAsync: async () => ({ success: true }),
  })
  const settingsServicePath = mockModule('services/settingsService.js', {
    readSettings: () => ({ allowAiContactsContext: true }),
  })
  const aiServicePath = mockModule('services/aiService.js', {
    generateAI: async (type, payload) => {
      requests.push({ type, payload })
      return {
        success: true,
        result: {
          role: 'AI 产品经理',
          bio: '专注 AI 产品设计',
          projects: [],
          tags: ['AI', '产品'],
        },
      }
    },
  })

  const { definition, absolutePath } = loadPageDefinition('pages/edit/edit.js')
  const ctx = createPageContext(definition, {
    aiInput: '我最近在做 AI 产品和效率工具',
    name: '王杰',
    role: '独立开发者',
    company: 'eSeat',
    bio: '正在打磨 AI 产品',
    locationCity: '深圳',
    techStack: 'AI, React',
    business: 'AI 产品',
    cooperation: '寻找合作伙伴',
    projects: [{ title: 'CodeFlow AI', description: 'AI 工作流', tags: 'AI, SaaS' }],
    customCards: [{ title: '关注方向', content: 'AI 工具、效率应用' }],
  })

  await definition.generateFromAI.call(ctx)

  assert.strictEqual(requests.length, 1)
  assert.strictEqual(requests[0].type, 'extract')
  assert.strictEqual(requests[0].payload.allowContactsContext, true)
  assert.strictEqual(requests[0].payload.selfProfileDraft.name, '王杰')
  assert.strictEqual(requests[0].payload.selfProfileDraft.role, '独立开发者')
  assert.strictEqual(requests[0].payload.selfProfileDraft.techStack, 'AI, React')
  assert.strictEqual(requests[0].payload.selfProfileDraft.projects[0].title, 'CodeFlow AI')
  assert.strictEqual(ctx.data.role, 'AI 产品经理')

  ;[absolutePath, aiServicePath, userServicePath, cardServicePath, settingsServicePath].forEach((moduleId) => {
    delete require.cache[moduleId]
  })
}

async function main() {
  await testGenerateFromAiPassesSelfProfileAndContactsAuthorization()
  console.log('edit page ai context tests passed')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
