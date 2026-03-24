// cloud init.js
// 云开发初始化

const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database()
  const _ = db.command
  
  try {
    // 创建名片集合（如果不存在）
    await db.createCollectionIfNotExists('cards')
    
    // 创建产品集合（如果不存在）
    await db.createCollectionIfNotExists('products')
    
    return {
      success: true,
      message: '数据库初始化成功'
    }
  } catch (e) {
    return {
      success: false,
      error: e
    }
  }
}
