// cloud function - getCard
const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const db = cloud.database()
  const _ = db.command
  const wxContext = cloud.getWXContext()

  try {
    // 获取当前用户的卡片数据
    const userInfo = wxContext.OPENID
    
    // 尝试获取已存在的名片
    const cards = await db.collection('cards').where({
      _openid: userInfo
    }).get()

    if (cards.data.length > 0) {
      // 返回已存在的名片
      return {
        success: true,
        data: cards.data[0]
      }
    } else {
      // 创建默认名片
      const defaultCard = {
        bannerUrl: 'https://images.unsplash.com/photo-1647247743538-0137d6a8a268',
        avatarUrl: 'https://images.unsplash.com/photo-1701463387028-3947648f1337',
        name: '',
        role: '',
        location: '',
        bio: '',
        githubUrl: '',
        twitterUrl: '',
        years: '',
        products: '',
        users: '',
        phone: '',
        email: '',
        projects: [],
        _openid: userInfo,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
      
      const result = await db.collection('cards').add({
        data: defaultCard
      })
      
      return {
        success: true,
        data: defaultCard,
        isNew: true
      }
    }
  } catch (e) {
    return {
      success: false,
      error: e.message
    }
  }
}
