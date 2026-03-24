// cloud function - aiGenerate
// AI 从一段文字自动提取名片字段

const cloud = require('wx-server-sdk')
cloud.init()

// 简单的规则提取（后续可接入真实 AI API）
function extractFields(text) {
  const result = {
    name: '',
    role: '',
    locationCountry: '',
    locationCity: '',
    bio: text, // 原始文本作为简介
    years: '',
    techStack: '',
    styles: '',
    company: '',
    business: '',
    tags: []
  }
  
  if (!text) return result
  
  // 提取工作年限
  const yearPatterns = [
    /(\d+)\s*年/i,
    /(\d+)\s*years/i,
    /(\d+)\+/
  ]
  for (const pattern of yearPatterns) {
    const match = text.match(pattern)
    if (match) {
      result.years = match[1] + '+'
      break
    }
  }
  
  // 提取技术栈
  const techKeywords = [
    'Python', 'JavaScript', 'React', 'Vue', 'Node', 'Java', 'Go', 'Rust',
    'AI', 'GPT', 'LLM', '机器学习', '深度学习', 'Flutter', 'iOS', 'Android',
    '小程序', '前端', '后端', '全栈', '算法', '数据分析'
  ]
  for (const tech of techKeywords) {
    if (text.includes(tech)) {
      result.techStack += (result.techStack ? ', ' : '') + tech
    }
  }
  
  // 提取角色
  const roleKeywords = [
    { keyword: '独立开发者', role: '独立开发者' },
    { keyword: '全栈', role: '全栈工程师' },
    { keyword: '前端', role: '前端工程师' },
    { keyword: '后端', role: '后端工程师' },
    { keyword: '产品经理', role: '产品经理' },
    { keyword: '设计师', role: '设计师' },
    { keyword: 'CEO', role: 'CEO' },
    { keyword: '创始人', role: '创始人' },
    { keyword: '运营', role: '运营' },
    { keyword: '创始人', role: '创始人' }
  ]
  for (const item of roleKeywords) {
    if (text.includes(item.keyword)) {
      result.role = item.role
      break
    }
  }
  
  // 提取地点
  const cities = ['北京', '上海', '深圳', '广州', '杭州', '成都', '武汉', '南京', '西安', '苏州']
  for (const city of cities) {
    if (text.includes(city)) {
      result.locationCity = city
      result.locationCountry = '中国'
      break
    }
  }
  const foreignCities = ['东京', '纽约', '硅谷', '伦敦', '新加坡', '悉尼']
  for (const city of foreignCities) {
    if (text.includes(city)) {
      result.locationCity = city
      result.locationCountry = ''
      break
    }
  }
  
  // 生成标签
  if (text.includes('独立') || text.includes('一人公司')) {
    result.tags.push('独立开发者')
  }
  if (text.includes('AI') || text.includes('GPT')) {
    result.tags.push('AI')
  }
  if (text.includes('产品')) {
    result.tags.push('产品')
  }
  if (text.includes('创业')) {
    result.tags.push('创业')
  }
  if (text.includes('开源')) {
    result.tags.push('开源')
  }
  
  // 自动生成一句介绍
  let intro = ''
  if (result.role) {
    intro = result.role
    if (result.locationCity) {
      intro += '，' + result.locationCity
    }
    if (result.techStack) {
      intro += '，擅长' + result.techStack.split(',')[0]
    }
  }
  result.bio = intro || text
  
  return result
}

// 优化文案
function optimizeText(text) {
  // 简单的优化逻辑
  let optimized = text
  
  // 去除重复词
  const words = text.split(/[，,。.]/)
  const unique = [...new Set(words.filter(w => w.trim()))]
  
  if (unique.length > 3) {
    optimized = unique.slice(0, 3).join('，') + '。'
  }
  
  // 添加一些连接词让文案更流畅
  if (!text.includes('专注') && !text.includes('致力于')) {
    optimized = '专注于' + optimized
  }
  
  return optimized
}

exports.main = async (event, context) => {
  const { type, data } = event
  
  try {
    let result = {}
    
    switch (type) {
      case 'extract':
        // 从一段文字提取所有字段
        result = extractFields(data.text || '')
        break
        
      case 'optimize':
        // 优化现有文案
        result = {
          optimizedText: optimizeText(data.text || '')
        }
        break
        
      case 'generateIntro':
        // 根据字段生成一句介绍
        const { role, locationCity, techStack } = data
        result = {
          intro: [
            role || '创作者',
            locationCity ? `，位于${locationCity}` : '',
            techStack ? `，擅长${techStack}` : ''
          ].join('')
        }
        break
        
      default:
        result = { error: '未知类型' }
    }
    
    return {
      success: true,
      result: result
    }
  } catch (e) {
    return {
      success: false,
      error: e.message
    }
  }
}
