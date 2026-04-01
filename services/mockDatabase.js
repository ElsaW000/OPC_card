const DB_KEY = 'opc_mock_database_v1'

function nowIso() {
  return new Date().toISOString()
}

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function buildDefaultCard(userId) {
  const cardId = uid('card')
  return {
    _id: cardId,
    userId,
    template: 'universal',
    type: 'tech',
    typeIcon: 'card',
    title: '\u6280\u672f\u5f00\u53d1\u540d\u7247',
    bannerUrl: 'https://images.unsplash.com/photo-1647247743538-0137d6a8a268?w=1080',
    avatarUrl: 'https://images.unsplash.com/photo-1701463387028-3947648f1337?w=400',
    name: '\u9648\u5c0f\u72ec\u7acb',
    nameEn: 'Independent Chen',
    locationCountry: '\u4e2d\u56fd',
    locationCity: '\u6df1\u5733',
    role: 'eSeat \u521b\u59cb\u4eba / \u5168\u6808\u5de5\u7a0b\u5e08',
    bio: '\u4e00\u4e2a\u4e13\u6ce8\u4e8e\u6784\u5efa AI \u5de5\u5177\u4e0e\u6548\u7387\u5e94\u7528\u7684\u72ec\u7acb\u5f00\u53d1\u8005\uff0c\u559c\u6b22\u628a\u590d\u6742\u7684\u903b\u8f91\u7b80\u5316\u4e3a\u76f4\u89c2\u7684\u4f53\u9a8c\u3002',
    years: '8+',
    techStack: 'React, Python, AI',
    portfolio: '',
    styles: '',
    experience: '',
    company: 'ONE PERSON COMPANY',
    business: 'AI \u4ea7\u54c1\u3001\u81ea\u52a8\u5316\u5de5\u5177\u3001\u72ec\u7acb\u5f00\u53d1',
    cooperation: '\u4ea7\u54c1\u5408\u4f5c / \u6280\u672f\u54a8\u8be2 / \u5171\u521b\u9879\u76ee',
    wechat: 'indie-chen',
    githubUrl: 'https://github.com/example',
    twitterUrl: 'https://x.com/example',
    products: '12',
    users: '25k',
    phone: '13800138000',
    email: 'hello@example.com',
    projects: [
      {
        id: uid('project'),
        title: 'CodeFlow AI',
        description: '\u4e00\u4e2a\u5e2e\u52a9\u72ec\u7acb\u5f00\u53d1\u8005\u901a\u8fc7\u81ea\u7136\u8bed\u8a00\u76f4\u63a5\u751f\u6210 React \u7ec4\u4ef6\u7684 AI \u5de5\u4f5c\u6d41\u3002',
        thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
        link: 'https://codeflow.example.com',
        github: 'https://github.com/example/codeflow',
        tags: ['AI', 'React', 'SaaS']
      },
      {
        id: uid('project'),
        title: 'ZenTask Mobile',
        description: '\u9762\u5411\u5c0f\u56e2\u961f\u7684\u8f7b\u4efb\u52a1\u7cfb\u7edf\uff0c\u5f3a\u8c03\u79fb\u52a8\u7aef\u5feb\u901f\u8bb0\u5f55\u4e0e\u4f4e\u8d1f\u62c5\u534f\u4f5c\u3002',
        thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800',
        link: 'https://zentask.example.com',
        github: '',
        tags: ['Mobile', 'Flutter', 'Efficiency']
      }
    ],
    videos: [
      {
        id: uid('video'),
        title: '\u6f14\u793a\uff1a\u5982\u4f55 5 \u5206\u949f\u5185\u4f7f\u7528 CodeFlow AI \u751f\u6210 UI',
        thumbnail: 'https://images.unsplash.com/photo-1522542550221-31fd19575a2d?w=800',
        link: 'https://example.com/demo-video',
        views: '12k',
        duration: '01:45'
      }
    ],
    customCards: [
      { id: uid('custom'), title: '\u6b63\u5728\u5bfb\u627e', content: '\u4ea7\u54c1\u5408\u4f5c\u3001AI \u9879\u76ee\u5171\u521b\u3001\u6548\u7387\u5de5\u5177\u53d1\u884c\u4f19\u4f34' }
    ],
    footerTitle: '\u8054\u7cfb\u6211',
    footerDesc: '\u5982\u679c\u4f60\u4e5f\u5728\u505a\u6709\u610f\u601d\u7684\u4ea7\u54c1\uff0c\u6b22\u8fce\u901a\u8fc7\u5fae\u4fe1\u6216\u90ae\u7bb1\u548c\u6211\u4ea4\u6d41\u3002',
    isDefault: true,
    createdAt: nowIso(),
    updatedAt: nowIso()
  }
}

function buildSeed(userId) {
  const ownCard = buildDefaultCard(userId)
  return {
    currentUser: {
      userId,
      openid: `mock_${userId}`,
      appid: 'wx-local-dev',
      nickname: 'eSeat \u6d4b\u8bd5\u7528\u6237',
      createdAt: nowIso(),
      updatedAt: nowIso()
    },
    users: [],
    cards: [ownCard],
    contacts: [
      {
        _id: uid('contact'),
        ownerUserId: userId,
        contactUserId: 'contact_remote_1',
        cardId: ownCard._id,
        name: '\u6797\u77e5\u8fdc',
        role: '\u4ea7\u54c1\u7ecf\u7406 / AI \u5e94\u7528\u8bbe\u8ba1',
        company: 'Morning Labs',
        phone: '13900001111',
        email: 'lin@example.com',
        wechat: 'lin-vision',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
        bannerUrl: ownCard.bannerUrl,
        bio: '\u5173\u6ce8 AI \u4ea7\u54c1\u8bbe\u8ba1\u4e0e\u56e2\u961f\u534f\u4f5c\u6548\u7387\u3002',
        tags: ['AI', '\u4ea7\u54c1'],
        starred: true,
        hasUpdate: true,
        updateType: 'projects',
        updateMessage: '\u66f4\u65b0\u4e86 2 \u4e2a\u4ea7\u54c1\u9879\u76ee',
        status: 'active',
        latestInteractionText: '\u6628\u5929\u4ea4\u6362\u4e86\u540d\u7247',
        createdAt: nowIso(),
        updatedAt: nowIso()
      },
      {
        _id: uid('contact'),
        ownerUserId: userId,
        contactUserId: 'contact_remote_2',
        cardId: ownCard._id,
        name: '\u5b8b\u4ea6\u5b89',
        role: '\u72ec\u7acb\u5f00\u53d1\u8005',
        company: 'Indie Forge',
        phone: '13700002222',
        email: 'song@example.com',
        wechat: 'song-dev',
        avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300',
        bannerUrl: ownCard.bannerUrl,
        bio: '\u6301\u7eed\u505a AI \u5de5\u5177\u548c\u8f7b\u91cf\u4ea7\u54c1\u3002',
        tags: ['\u72ec\u7acb\u5f00\u53d1'],
        starred: false,
        hasUpdate: false,
        updateType: '',
        updateMessage: '',
        status: 'pending',
        latestInteractionText: '\u521a\u521a\u53d1\u8d77\u4ea4\u6362\u8bf7\u6c42',
        createdAt: nowIso(),
        updatedAt: nowIso()
      }
    ],
    visitors: [
      {
        _id: uid('visitor'),
        ownerUserId: userId,
        visitorUserId: 'visitor_1',
        cardId: ownCard._id,
        name: '\u82cf\u6668',
        role: '\u589e\u957f\u987e\u95ee',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
        source: '\u5fae\u4fe1\u5206\u4eab',
        visitDate: nowIso(),
        visitTimeText: '\u521a\u521a',
        visitCount: 1,
        createdAt: nowIso(),
        updatedAt: nowIso()
      },
      {
        _id: uid('visitor'),
        ownerUserId: userId,
        visitorUserId: 'visitor_2',
        cardId: ownCard._id,
        name: '\u4f55\u4e00\u6f84',
        role: '\u521b\u4e1a\u8005',
        avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300',
        source: '\u4e8c\u7ef4\u7801\u8bbf\u95ee',
        visitDate: new Date(Date.now() - 86400000).toISOString(),
        visitTimeText: '\u6628\u5929',
        visitCount: 2,
        createdAt: nowIso(),
        updatedAt: nowIso()
      }
    ],
    exchangeRecords: [],
    meta: {
      seededAt: nowIso(),
      mode: 'local-storage'
    }
  }
}

function hasGarbledText(db) {
  try {
    const serialized = JSON.stringify(db)
    return serialized.includes('Ã') || serialized.includes('â€')
  } catch (error) {
    return false
  }
}

function readDatabase() {
  let db = wx.getStorageSync(DB_KEY)
  if (!db || typeof db !== 'object' || hasGarbledText(db)) {
    db = buildSeed(uid('user'))
    wx.setStorageSync(DB_KEY, db)
  }
  return db
}

function writeDatabase(db) {
  wx.setStorageSync(DB_KEY, db)
  return db
}

function updateDatabase(updater) {
  const db = readDatabase()
  const next = updater(db) || db
  writeDatabase(next)
  return next
}

module.exports = {
  DB_KEY,
  uid,
  nowIso,
  readDatabase,
  writeDatabase,
  updateDatabase
}