// cloud function - aiGenerate
// AI 从一段文字自动提取名片字段

const cloud = require('wx-server-sdk')
const https = require('https')
const crypto = require('crypto')

cloud.init()

// Minimax API 配置 - 从云开发环境变量读取
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '' // 在云开发环境变量中配置
const MINIMAX_MODEL = 'abab6.5s-chat'

// 解析 JSON 字符串（处理 markdown 代码块）
function parseJSON(str) {
  try {
    // 尝试直接解析
    return JSON.parse(str)
  } catch (e) {
    // 尝试去除 markdown 代码块
    const match = str.match(/```json\n?([\s\S]*?)\n?```/)
    if (match) {
      try {
        return JSON.parse(match[1])
      } catch (e2) {
        console.error('JSON parse failed:', e2)
      }
    }
  }
  return null
}

// 调用 Minimax API
function callMinimax(prompt) {
  return new Promise((resolve, reject) => {
    const timestamp = Math.floor(Date.now() / 1000)
    const url = '/v1/text/chatcompletion_v2'
    
    // 签名生成（简单版本，实际需要根据文档）
    const body = JSON.stringify({
      model: MINIMAX_MODEL,
      messages: [
        { role: 'system', content: '你是一个名片信息提取助手，根据用户输入的文本，提取并返回结构化的名片信息。' },
        { role: 'user', content: prompt }
      ]
    })
    
    const options = {
      hostname: 'api.minimax.chat',
      path: url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MINIMAX_API_KEY}`
      }
    }
    
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          resolve(json)
        } catch (e) {
          reject(e)
        }
      })
    })
    
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// 智能提取名片字段（使用 AI）
async function extractWithAI(text) {
  const prompt = `请从以下文本中提取名片信息，并以 JSON 格式返回：
    
文本：${text}

请返回以下格式的 JSON：
{
  "name": "姓名",
  "role": "职业/职位",
  "locationCountry": "国家",
  "locationCity": "城市",
  "bio": "一句话介绍",
  "years": "工作年限，如：5",
  "techStack": "技术栈，用逗号分隔",
  "tags": ["标签1", "标签2"]
}

只返回 JSON，不要其他内容。`

  try {
    const response = await callMinimax(prompt)
    if (response.choices && response.choices[0]) {
      const content = response.choices[0].message.content
      const parsed = parseJSON(content)
      if (parsed) {
        return parsed
      }
    }
  } catch (e) {
    console.error('Minimax API error:', e)
  }
  
  // 如果 API 调用失败，使用规则提取
  return extractWithRules(text)
}

// 规则提取（备用方案）
function extractWithRules(text) {
  const result = {
    name: '',
    role: '',
    locationCountry: '',
    locationCity: '',
    bio: text,
    years: '',
    techStack: '',
    tags: []
  }
  
  if (!text) return result
  
  // 提取工作年限
  const yearMatch = text.match(/(\d+)\s*年/i)
  if (yearMatch) {
    result.years = yearMatch[1]
  }
  
  // 提取技术栈
  const techKeywords = [
    'Python', 'JavaScript', 'TypeScript', 'React', 'Vue', 'Node', 'Java', 'Go', 'Rust',
    'AI', 'GPT', 'LLM', '机器学习', '深度学习', 'Flutter', 'iOS', 'Android',
    '小程序', '前端', '后端', '全栈', '算法', '数据分析', '区块链'
  ]
  const found = []
  for (const tech of techKeywords) {
    if (text.toLowerCase().includes(tech.toLowerCase())) {
      found.push(tech)
    }
  }
  result.techStack = found.join(', ')
  
  // 提取角色
  const roleKeywords = [
    { keyword: '独立开发者', role: '独立开发者' },
    { keyword: '全栈工程师', role: '全栈工程师' },
    { keyword: '前端工程师', role: '前端工程师' },
    { keyword: '后端工程师', role: '后端工程师' },
    { keyword: '产品经理', role: '产品经理' },
    { keyword: '设计师', role: '设计师' },
    { keyword: '创始人', role: '创始人' },
    { keyword: 'CEO', role: 'CEO' }
  ]
  for (const item of roleKeywords) {
    if (text.includes(item.keyword)) {
      result.role = item.role
      break
    }
  }
  
  // 提取地点
  const cnCities = ['北京', '上海', '深圳', '广州', '杭州', '成都', '武汉', '南京']
  for (const city of cnCities) {
    if (text.includes(city)) {
      result.locationCity = city
      result.locationCountry = '中国'
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
  if (text.includes('开源')) {
    result.tags.push('开源')
  }
  if (text.includes('创业')) {
    result.tags.push('创业')
  }
  
  // 生成一句介绍
  let intro = []
  if (result.role) intro.push(result.role)
  if (result.locationCity) intro.push(result.locationCity)
  if (result.techStack) intro.push('擅长' + result.techStack.split(',')[0])
  result.bio = intro.join('，') || text.substring(0, 50)
  
  return result
}

// 获取 GitHub 用户项目
async function fetchGitHubProjects(username) {
  const https = require('https')
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/users/${username}/repos?sort=updated&per_page=10`,
      method: 'GET',
      headers: {
        'User-Agent': 'eSeat-MiniApp'
      }
    }
    
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const repos = JSON.parse(data)
          const projects = repos.slice(0, 5).map(repo => ({
            name: repo.name,
            description: repo.description || '',
            url: repo.html_url,
            topics: repo.topics ? repo.topics.slice(0, 3) : [],
            stars: repo.stargazers_count
          }))
          
          // 按星标排序
          projects.sort((a, b) => b.stars - a.stars)
          
          resolve(projects)
        } catch (e) {
          reject(e)
        }
      })
    })
    
    req.on('error', reject)
    req.end()
  })
}

// 获取单个项目的 README
async function fetchProjectReadme(owner, repo) {
  const https = require('https')
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repo}`,
      method: 'GET',
      headers: {
        'User-Agent': 'eSeat-MiniApp'
      }
    }
    
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const repo = JSON.parse(data)
          resolve({
            name: repo.name,
            description: repo.description || '',
            topics: repo.topics ? repo.topics.slice(0, 5) : [],
            url: repo.html_url,
            stars: repo.stargazers_count
          })
        } catch (e) {
          reject(e)
        }
      })
    })
    
    req.on('error', reject)
    req.end()
  })
}

// 优化文案（使用 AI）
async function optimizeWithAI(text) {
  const prompt = `请优化以下自我介绍，使其更简洁、更有吸引力：
    
原始内容：${text}

请返回优化后的版本，只返回优化后的文本，不要其他内容。`

  try {
    const response = await callMinimax(prompt)
    if (response.choices && response.choices[0]) {
      return response.choices[0].message.content
    }
  } catch (e) {
    console.error('Minimax API error:', e)
  }
  
  // 备用：简单优化
  return '优化后的：' + text
}

exports.main = async (event, context) => {
  const { type, data } = event
  
  try {
    let result = {}
    
    switch (type) {
      case 'extract':
        // 从一段文字提取所有字段（优先 AI，失败则用规则）
        result = await extractWithAI(data.text || '')
        break
        
      case 'optimize':
        // 优化现有文案
        result = {
          optimizedText: await optimizeWithAI(data.text || '')
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
        
      case 'fetchGitHub':
        // 获取 GitHub 用户项目
        result = {
          projects: await fetchGitHubProjects(data.username || '')
        }
        break
        
      case 'fetchProjectReadme':
        // 获取单个项目信息并完善
        result = await fetchProjectReadme(data.owner || '', data.repo || '')
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
