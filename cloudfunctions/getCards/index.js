// cloud function - getCards
// 获取用户的所有名片

const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const db = cloud.database()
  const wxContext = cloud.getWXContext()

  try {
    const userInfo = wxContext.OPENID
    
    // 获取用户的所有名片
    const cards = await db.collection('cards').where({
      _openid: userInfo
    }).get()

    if (cards.data.length > 0) {
      return {
        success: true,
        data: cards.data,
        defaultCard: cards.data.find(c => c.isDefault) || cards.data[0]
      }
    } else {
      // 创建默认名片
      const defaultCard = {
        type: 'tech', // tech, biz, social, custom
        title: '我的名片',
        bannerUrl: 'https://images.unsplash.com/photo-1647247743538-0137d6a8a268',
        avatarUrl: 'https://images.unsplash.com/photo-1701463387028-3947648f1337',
        name: '',
        nameEn: '',
        locationCountry: '',
        locationCity: '',
        role: '',
        bio: '',
        years: '',
        techStack: '',
        portfolio: '',
        styles: '',
        experience: '',
        company: '',
        business: '',
        cooperation: '',
        wechat: '',
        githubUrl: '',
        twitterUrl: '',
        products: '',
        users: '',
        phone: '',
        email: '',
        projects: [],
        videos: [],
        customCards: [],
        footerTitle: '联系我',
        footerDesc: '如有合作意向，欢迎通过以下方式联系',
        isDefault: true,
        _openid: userInfo,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
      
      await db.collection('cards').add({
        data: defaultCard
      })
      
      return {
        success: true,
        data: [defaultCard],
        defaultCard: defaultCard,
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
