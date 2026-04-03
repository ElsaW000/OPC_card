const { request } = require('./httpClient')
const { isRemoteApiEnabled } = require('./apiConfig')
const { getCurrentUser } = require('./userService')

const AI_PROVIDER_KEY = 'opc_ai_provider'

function getAIProvider() {
  return wx.getStorageSync(AI_PROVIDER_KEY) || 'qwen'
}

function setAIProvider(provider) {
  const next = provider === 'minimax' ? 'minimax' : 'qwen'
  wx.setStorageSync(AI_PROVIDER_KEY, next)
  return next
}

function extractWithRules(text = '') {
  const result = {
    name: '',
    role: '',
    locationCountry: '',
    locationCity: '',
    bio: text || '',
    years: '',
    techStack: '',
    tags: [],
    projects: [],
  }

  if (!text) return result

  const yearMatch = String(text).match(/(\d+)\s*年/)
  if (yearMatch) result.years = yearMatch[1]

  const techKeywords = ['Python', 'JavaScript', 'TypeScript', 'React', 'Vue', 'Node', 'Go', 'Rust', 'AI', 'GPT', 'LLM', 'Flutter', '小程序']
  const found = techKeywords.filter((item) => String(text).toLowerCase().includes(item.toLowerCase()))
  result.techStack = found.join(', ')

  const roleKeywords = [
    ['独立开发者', '独立开发者'],
    ['全栈工程师', '全栈工程师'],
    ['前端工程师', '前端工程师'],
    ['后端工程师', '后端工程师'],
    ['产品经理', '产品经理'],
    ['设计师', '设计师'],
    ['创始人', '创始人'],
    ['CEO', 'CEO'],
  ]
  roleKeywords.some(([keyword, role]) => {
    if (String(text).includes(keyword)) {
      result.role = role
      return true
    }
    return false
  })

  const cities = ['北京', '上海', '深圳', '广州', '杭州', '成都', '武汉', '南京']
  cities.some((city) => {
    if (String(text).includes(city)) {
      result.locationCity = city
      result.locationCountry = '中国'
      return true
    }
    return false
  })

  if (String(text).includes('独立') || String(text).includes('一人公司')) result.tags.push('独立开发者')
  if (/AI|GPT|LLM/i.test(String(text))) result.tags.push('AI')
  if (String(text).includes('开源')) result.tags.push('开源')
  if (String(text).includes('创业')) result.tags.push('创业')

  const bioParts = []
  if (result.role) bioParts.push(result.role)
  if (result.locationCity) bioParts.push(result.locationCity)
  if (found[0]) bioParts.push(`擅长${found[0]}`)
  result.bio = bioParts.join('，') || String(text).slice(0, 50)

  return result
}

function generateIntro(data = {}) {
  const role = data.role || '创作者'
  const location = data.locationCity || data.location || ''
  const techStack = data.techStack || data.keywords || ''
  return {
    intro: `${role}${location ? `，位于${location}` : ''}${techStack ? `，擅长${techStack}` : ''}`
  }
}

function generateTags(identity = '') {
  const mapping = [
    ['开发', ['技术', 'AI', '全栈']],
    ['工程师', ['技术', '产品', '效率']],
    ['设计', ['设计', '品牌', '创意']],
    ['老板', ['创业', '合作', '商业']],
    ['创始人', ['创业', '产品', '增长']],
  ]
  const tags = []
  mapping.forEach(([keyword, values]) => {
    if (String(identity).includes(keyword)) {
      values.forEach((item) => tags.push(item))
    }
  })
  return Array.from(new Set(tags.length ? tags : ['个人品牌', '合作', 'AI'])).slice(0, 5)
}

function buildLocalReply(message = '') {
  const lower = String(message).toLowerCase()
  if (lower.includes('简介') || lower.includes('bio') || lower.includes('介绍')) {
    return '建议你的简介突出三个要素：职业定位、核心能力、代表成果。'
  }
  if (lower.includes('标签') || lower.includes('tag')) {
    return '根据你的职业方向，推荐标签：AI、全栈、SaaS、独立开发、小程序。'
  }
  if (lower.includes('吸引') || lower.includes('更好')) {
    return '名片吸引力来自清晰定位、真实展示和明确行动入口。'
  }
  return '可以在编辑页使用 AI 一键填充，把你的个人介绍贴进去，我会自动提取关键字段。'
}

async function generateAI(type, data = {}) {
  const provider = getAIProvider()
  const shouldTryRemote = isRemoteApiEnabled()
  const requestTimeout = type === 'chat' ? 25000 : 15000

  if (!shouldTryRemote) {
    if (type === 'chat') {
      return {
        success: true,
        result: { reply: buildLocalReply(data.message || '') },
        meta: { localFallback: true, reason: 'remote-disabled' }
      }
    }
    if (type === 'extract') return { success: true, result: extractWithRules(data.text || '') }
    if (type === 'generateIntro' || type === 'intro') return { success: true, result: generateIntro(data) }
    if (type === 'tags') return { success: true, result: generateTags(data.identity || '') }
    if (type === 'optimize') return { success: true, result: { optimizedText: `优化后的自我介绍：${data.bio || data.text || ''}` } }
    return { success: false }
  }
  try {
    const user = getCurrentUser()
    return await request({
      url: '/ai/generate',
      method: 'POST',
      data: { type, data, provider },
      userId: user && user.userId ? user.userId : '',
      timeout: requestTimeout,
    })
  } catch (error) {
    if (type === 'chat') {
      return {
        success: true,
        result: { reply: buildLocalReply(data.message || '') },
        meta: {
          localFallback: true,
          reason: 'remote-failed',
          error: error && (error.message || error.errMsg) ? (error.message || error.errMsg) : 'request failed'
        }
      }
    }
    if (type === 'extract') return { success: true, result: extractWithRules(data.text || '') }
    if (type === 'generateIntro' || type === 'intro') return { success: true, result: generateIntro(data) }
    if (type === 'tags') return { success: true, result: generateTags(data.identity || '') }
    if (type === 'optimize') return { success: true, result: { optimizedText: `优化后的自我介绍：${data.bio || data.text || ''}` } }
    throw error
  }
}

module.exports = {
  generateAI,
  getAIProvider,
  setAIProvider,
}
