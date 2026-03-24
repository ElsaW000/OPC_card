// cloud function - aiGenerate
// AI 生成名片内容

const cloud = require('wx-server-sdk')
cloud.init()

// 模拟 AI 生成（后续可接入真实 AI API）
function mockAIGenerate(prompt, type) {
  const templates = {
    intro: [
      "一名专注于构建 AI 工具与效率应用的独立开发者",
      "致力于打造让创意工作者更高效的数字产品",
      "独立开发者和创作者，专注 AI 应用落地",
      "用技术赋能创意，让每个人都能成为自己的 CEO"
    ],
    tags: [
      ["独立开发者", "AI", "效率工具", "一人公司"],
      ["全栈工程师", "产品思维", "独立开发", "技术博客"],
      ["创作者", "AI工具", "效率提升", "数字产品"],
      ["开发者", "开源爱好者", "技术布道", "社区运营"]
    ]
  }
  
  const random = (arr) => arr[Math.floor(Math.random() * arr.length)]
  
  if (type === 'intro') {
    return random(templates.intro)
  } else if (type === 'tags') {
    return random(templates.tags)
  } else if (type === 'optimize') {
    return "优化后的自我介绍：" + prompt + "（这是模拟结果，后续接入真实 AI）"
  }
  
  return ""
}

exports.main = async (event, context) => {
  const { type, data } = event
  
  try {
    let result = ""
    
    switch (type) {
      case 'intro':
        // 根据用户输入的关键词生成一句话介绍
        result = mockAIGenerate(data.keywords || "", 'intro')
        break
        
      case 'tags':
        // 根据用户身份和方向推荐标签
        result = mockAIGenerate(data.identity || "", 'tags')
        break
        
      case 'optimize':
        // 优化现有介绍文案
        result = mockAIGenerate(data.bio || "", 'optimize')
        break
        
      case 'generateFromLink':
        // 从链接生成名片（模拟）
        result = {
          name: "AI 提取的名称",
          role: "AI 识别的角色",
          bio: "从链接中提取的简介",
          tags: ["AI提取", "技术"]
        }
        break
        
      default:
        result = "未知类型"
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
