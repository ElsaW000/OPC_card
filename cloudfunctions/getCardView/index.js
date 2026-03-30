const cloud = require('wx-server-sdk')

cloud.init()

function buildDefaultCard(openid, db) {
  return {
    template: 'universal',
    type: 'tech',
    typeIcon: 'card',
    title: '技术开发名片',
    bannerUrl: 'https://images.unsplash.com/photo-1647247743538-0137d6a8a268',
    avatarUrl: 'https://images.unsplash.com/photo-1701463387028-3947648f1337',
    name: '陈小独立',
    nameEn: 'Independent Chen',
    locationCountry: '中国',
    locationCity: '深圳',
    role: 'OPC 创始人 / 全栈工程师',
    bio: '专注 AI 工具、自动化和产品体验的独立开发者，正在构建更轻、更快的个人连接方式。',
    years: '8+',
    techStack: 'React, Python, AI',
    portfolio: '',
    styles: '',
    experience: '',
    company: 'ONE PERSON COMPANY',
    business: 'AI 产品、自动化工具、独立开发',
    cooperation: '产品合作 / 技术咨询 / 项目共创',
    wechat: 'indie-chen',
    githubUrl: 'https://github.com/example',
    twitterUrl: 'https://twitter.com/example',
    products: '12',
    users: '25k',
    phone: '13800138000',
    email: 'hello@example.com',
    projects: [],
    videos: [],
    customCards: [],
    footerTitle: '联系我',
    footerDesc: '如果你想聊产品、合作或一起做点有意思的事情，欢迎联系我。',
    isDefault: true,
    _openid: openid,
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  }
}

async function recordVisitor(db, card, viewerOpenid, source) {
  if (!card || !card._id || !card._openid || card._openid === viewerOpenid) {
    return
  }

  const visitorCollection = db.collection('visitors')
  const existing = await visitorCollection.where({
    ownerOpenid: card._openid,
    visitorOpenid: viewerOpenid,
    cardId: card._id
  }).limit(1).get()

  const visitorPayload = {
    ownerOpenid: card._openid,
    visitorOpenid: viewerOpenid,
    cardId: card._id,
    name: `访客${viewerOpenid.slice(-4)}`,
    role: '名片访客',
    avatarUrl: 'https://images.unsplash.com/photo-1573164713791-0dfcd2a183a7?w=200',
    source: source || '名片分享',
    visitDate: new Date().toISOString(),
    visitTimeText: '刚刚',
    updateTime: db.serverDate()
  }

  if (existing.data.length > 0) {
    await visitorCollection.doc(existing.data[0]._id).update({
      data: {
        ...visitorPayload,
        visitCount: (existing.data[0].visitCount || 1) + 1
      }
    })
    return
  }

  await visitorCollection.add({
    data: {
      ...visitorPayload,
      visitCount: 1,
      createTime: db.serverDate()
    }
  })
}

exports.main = async (event) => {
  const db = cloud.database()
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { cardId = '', source = '名片分享', recordVisit = true } = event

  try {
    const cardCollection = db.collection('cards')

    if (!cardId) {
      const cards = await cardCollection.where({ _openid: openid }).get()
      if (cards.data.length > 0) {
        return {
          success: true,
          data: cards.data.find((item) => item.isDefault) || cards.data[0],
          isOwner: true
        }
      }

      const defaultCard = buildDefaultCard(openid, db)
      const result = await cardCollection.add({ data: defaultCard })
      return {
        success: true,
        data: { ...defaultCard, _id: result._id },
        isOwner: true,
        isNew: true
      }
    }

    const card = await cardCollection.doc(cardId).get()
    if (!card.data) {
      return { success: false, error: '名片不存在' }
    }

    const isOwner = card.data._openid === openid
    if (!isOwner && recordVisit) {
      await recordVisitor(db, card.data, openid, source)
    }

    return {
      success: true,
      data: card.data,
      isOwner
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}