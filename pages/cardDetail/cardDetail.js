const app = getApp()
const { getCardViewAsync, setDefaultCardAsync } = require('../../services/cardService')
const { bootstrapSessionAsync } = require('../../services/userService')
const { recordVisitorAsync } = require('../../services/visitorService')

const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1647247743538-0137d6a8a268?w=1200'
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1701463387028-3947648f1337?w=400'
const DEFAULT_PROJECT_COVER = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900'
const DEFAULT_VIDEO_COVER = 'https://images.unsplash.com/photo-1647247743538-0137d6a8a268?w=900'

const TEXT = {
  unnamedProject: '\u672a\u547d\u540d\u9879\u76ee',
  pendingProject: '\u7b49\u5f85\u8865\u5145\u9879\u76ee\u8bf4\u660e',
  demoVideo: '\u6f14\u793a\u89c6\u9891',
  years: '\u5f00\u53d1\u5e74\u9650',
  products: '\u4e0a\u7ebf\u4ea7\u54c1',
  users: '\u5168\u7403\u7528\u6237',
  phone: '\u624b\u673a',
  email: '\u90ae\u7bb1',
  wechat: '\u5fae\u4fe1',
  defaultName: '\u9648\u5c0f\u72ec\u7acb',
  defaultRole: 'eSeat \u521b\u59cb\u4eba / \u5168\u6808\u5de5\u7a0b\u5e08',
  defaultBio: '\u4e00\u540d\u4e13\u6ce8\u4e8e\u6784\u5efa AI \u5de5\u5177\u4e0e\u6548\u7387\u4ea7\u54c1\u7684\u72ec\u7acb\u5f00\u53d1\u8005\uff0c\u6301\u7eed\u6253\u78e8\u4ea7\u54c1\u4f53\u9a8c\uff0c\u5e76\u628a\u590d\u6742\u903b\u8f91\u8f6c\u5316\u6210\u76f4\u89c2\u7684\u754c\u9762\u3002',
  defaultReady: '\u5f53\u524d\u5df2\u662f\u9ed8\u8ba4\u540d\u7247',
  defaultTodo: '\u9ed8\u8ba4\u540d\u7247\u529f\u80fd\u5f85\u63a5\u771f\u5b9e\u63a5\u53e3',
  shareOpened: '\u5df2\u6253\u5f00\u5206\u4eab\u9762\u677f',
  shareCard: '\u4e8c\u7ef4\u7801',
  viewQr: '\u67e5\u770b\u4e8c\u7ef4\u7801',
  detailLoadFailed: '\u540d\u7247\u8be6\u60c5\u52a0\u8f7d\u5931\u8d25',
  projectTitle: '\u7cbe\u9009\u9879\u76ee',
  projectMore: 'View All',
  videoTitle: '\u89c6\u9891\u4e0e\u6f14\u793a',
  videoMore: 'Recent',
  contactTitle: '\u8054\u7cfb\u6211',
  contactDesc: '\u6b22\u8fce\u901a\u8fc7\u4ee5\u4e0b\u65b9\u5f0f\u5efa\u7acb\u8fde\u63a5\uff0c\u6211\u4f1a\u5c3d\u5feb\u56de\u590d\u3002',
  exchangeCard: '\u4ea4\u6362\u540d\u7247',
  editCard: '\u7f16\u8f91\u540d\u7247',
  shareTitleFallback: '\u6211\u7684 eSeat \u540d\u7247',
  setDefaultDone: '\u5df2\u8bbe\u4e3a\u9ed8\u8ba4\u540d\u7247',
  setDefaultFailed: '\u8bbe\u7f6e\u9ed8\u8ba4\u5931\u8d25',
}

function toStringValue(value, fallback = '') {
  if (value === undefined || value === null) {
    return fallback
  }
  return String(value)
}

function toTagList(value, fallback) {
  if (Array.isArray(value)) {
    return value.map((item) => toStringValue(item).trim()).filter(Boolean)
  }
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean)
  }
  return fallback
}

function normalizeProject(project = {}, index = 0) {
  return {
    id: toStringValue(project.id, `project-${index}`),
    title: toStringValue(project.title, TEXT.unnamedProject),
    description: toStringValue(project.description, TEXT.pendingProject),
    thumbnail: toStringValue(project.thumbnail || project.thumbnailUrl || project.cover, DEFAULT_PROJECT_COVER),
    link: toStringValue(project.link || project.linkUrl),
    github: toStringValue(project.github || project.githubUrl),
    tags: toTagList(project.tags, ['AI', 'React', 'SaaS'])
  }
}

function normalizeVideo(video = {}, index = 0) {
  return {
    id: toStringValue(video.id, `video-${index}`),
    title: toStringValue(video.title, TEXT.demoVideo),
    thumbnail: toStringValue(video.thumbnail || video.thumbnailUrl || video.cover, DEFAULT_VIDEO_COVER),
    link: toStringValue(video.link || video.linkUrl),
    views: toStringValue(video.views || video.viewsText, '12k'),
    duration: toStringValue(video.duration || video.durationText, '01:45')
  }
}

function buildStats(card = {}) {
  return [
    { key: 'years', value: toStringValue(card.years), label: TEXT.years },
    { key: 'products', value: toStringValue(card.products), label: TEXT.products },
    { key: 'users', value: toStringValue(card.users), label: TEXT.users }
  ].filter((item) => item.value)
}

function buildContactItems(card = {}) {
  const items = []

  if (card.phone) {
    items.push({ key: 'phone', icon: '/images/icons/phone.png', label: TEXT.phone, value: toStringValue(card.phone) })
  }
  if (card.email) {
    items.push({ key: 'email', icon: '', emoji: TEXT.email.slice(0, 1), label: TEXT.email, value: toStringValue(card.email) })
  }
  if (card.wechat) {
    items.push({ key: 'wechat', icon: '', emoji: TEXT.wechat.slice(0, 1), label: TEXT.wechat, value: toStringValue(card.wechat) })
  }

  return items
}

function buildSafeCard(card = {}) {
  const isMockCard = !!card.__isMock
  const tags = isMockCard ? toTagList(card.tags || card.techStack, ['AI', 'React', 'SaaS']) : toTagList(card.tags || card.techStack, [])
  const projects = Array.isArray(card.projects) ? card.projects.map(normalizeProject) : []
  const videos = Array.isArray(card.videos) ? card.videos.map(normalizeVideo) : []
  const customCards = Array.isArray(card.customCards)
    ? card.customCards.map((item, index) => ({
        id: toStringValue(item.id, `custom-${index}`),
        title: toStringValue(item.title),
        content: toStringValue(item.content)
      })).filter((item) => item.title || item.content)
    : []
  const location = [toStringValue(card.locationCountry), toStringValue(card.locationCity)].filter(Boolean).join(' / ')

  return {
    id: toStringValue(card.id || card._id),
    name: toStringValue(card.name, isMockCard ? TEXT.defaultName : ''),
    nameEn: toStringValue(card.nameEn, isMockCard ? 'Independent Chen' : ''),
    role: toStringValue(card.role, isMockCard ? TEXT.defaultRole : ''),
    company: toStringValue(card.company, isMockCard ? 'eSeat' : ''),
    bio: (() => {
      const rawBio = toStringValue(card.bio)
      if (rawBio && !/[.]{3}$|â€¦$/.test(rawBio)) return rawBio
      return isMockCard ? TEXT.defaultBio : ''
    })(),
    bannerUrl: toStringValue(card.bannerUrl, DEFAULT_BANNER),
    avatarUrl: toStringValue(card.avatarUrl, DEFAULT_AVATAR),
    isDefault: !!card.isDefault,
    location,
    phone: toStringValue(card.phone),
    email: toStringValue(card.email),
    wechat: toStringValue(card.wechat),
    footerTitle: toStringValue(card.footerTitle, isMockCard ? TEXT.contactTitle : ''),
    footerDesc: toStringValue(card.footerDesc, isMockCard ? TEXT.contactDesc : ''),
    stats: buildStats(card),
    tags,
    customCards,
    projects: projects.length ? projects : (isMockCard ? [normalizeProject({
      id: 'project-1',
      title: 'CodeFlow AI',
      description: '\u5e2e\u52a9\u72ec\u7acb\u5f00\u53d1\u8005\u7528\u81ea\u7136\u8bed\u8a00\u5feb\u901f\u751f\u6210\u754c\u9762\u4e0e\u7ec4\u4ef6\u7684 AI \u5de5\u4f5c\u6d41\u3002',
      thumbnail: DEFAULT_PROJECT_COVER,
      link: '\u5728\u7ebf\u4f53\u9a8c',
      github: 'GitHub',
      tags: ['AI', 'React', 'SaaS']
    })] : []),
    videos: videos.length ? videos : (isMockCard ? [normalizeVideo({
      id: 'video-1',
      title: '\u6f14\u793a\uff1a\u5982\u4f55\u5728 5 \u5206\u949f\u5185\u7528 CodeFlow AI \u751f\u6210 UI',
      thumbnail: DEFAULT_VIDEO_COVER,
      views: '12k',
      duration: '01:45'
    })] : [])
  }
}

function getMockCards() {
  return [{
    __isMock: true,
    id: '1',
    name: TEXT.defaultName,
    nameEn: 'Independent Chen',
    role: TEXT.defaultRole,
    company: 'eSeat',
    bio: TEXT.defaultBio,
    avatarUrl: DEFAULT_AVATAR,
    bannerUrl: DEFAULT_BANNER,
    isDefault: true,
    locationCountry: '\u4e2d\u56fd',
    locationCity: '\u6df1\u5733',
    years: '8+',
    products: '12',
    users: '25k',
    phone: '138 0013 8000',
    email: 'chen@example.com',
    wechat: 'indie-chen',
    techStack: 'AI, React, SaaS',
    customCards: [{
      id: 'c1',
      title: '\u8fd1\u65e5\u9700\u6c42',
      content: '\u6b63\u5728\u5bfb\u627e AI \u6548\u7387\u5de5\u5177\u3001B \u7aef SaaS \u5408\u4f5c\u4e0e\u72ec\u7acb\u5f00\u53d1\u4ea7\u54c1\u5171\u521b\u673a\u4f1a\u3002'
    }],
    projects: [{
      id: 'p1',
      title: 'CodeFlow AI',
      description: '\u5e2e\u52a9\u72ec\u7acb\u5f00\u53d1\u8005\u901a\u8fc7\u81ea\u7136\u8bed\u8a00\u5feb\u901f\u642d\u5efa\u9875\u9762\u4e0e\u7ec4\u4ef6\u3002',
      thumbnail: DEFAULT_PROJECT_COVER,
      link: '\u5728\u7ebf\u4f53\u9a8c',
      github: 'GitHub',
      tags: ['AI', 'React', 'SaaS']
    }],
    videos: [{
      id: 'v1',
      title: '\u6f14\u793a\uff1a\u5982\u4f55\u5728 5 \u5206\u949f\u5185\u7528 CodeFlow AI \u751f\u6210 UI',
      thumbnail: DEFAULT_VIDEO_COVER,
      views: '12k',
      duration: '01:45'
    }]
  }]
}

Page({
  data: {
    card: null,
    contactItems: [],
    labels: TEXT,
    isPublicView: false,
    isVisitorMode: false,
  },

  onLoad(options) {
    const cardId = options && options.id ? options.id : ''
    const isPublicView = !!(options && options.view === 'public')
    const isVisitorMode = !!(options && options.visitor === '1')
    this.cardId = cardId
    this.setData({ isPublicView, isVisitorMode })
    this.loadCard(cardId)
  },

  async loadCard(id) {
    try {
      await bootstrapSessionAsync()
      const result = await getCardViewAsync(id || '')
      if (result && result.success && result.data) {
        const card = buildSafeCard(result.data)
        this.setData({
          card,
          contactItems: buildContactItems(card)
        })
        // 访客模式：记录访问
        if (this.data.isVisitorMode && id) {
          recordVisitorAsync(id, '名片分享').catch(() => {})
        }
        return
      }
    } catch (error) {
      console.error('load card detail failed:', error)
    }

    const source = app.globalData && app.globalData.cardData
      ? [app.globalData.cardData].concat(getMockCards())
      : getMockCards()
    const matched = source.find((item) => String(item.id || item._id) === String(id)) || source[0]
    const card = buildSafeCard(matched)
    this.setData({
      card,
      contactItems: buildContactItems(card)
    })
  },

  goBack() {
    wx.navigateBack({ delta: 1 })
  },

  editCard() {
    const cardId = this.data.card && this.data.card.id ? this.data.card.id : ''
    wx.navigateTo({ url: `/pages/edit/edit?id=${cardId}` })
  },

  prepareShareCard() {
    this.currentShareCard = this.data.card || null
  },

  onShareAppMessage() {
    const card = this.currentShareCard || this.data.card
    const cardId = card && card.id ? card.id : ''
    return {
      title: card && card.name ? `${card.name} - ${card.role || TEXT.shareTitleFallback}` : TEXT.shareTitleFallback,
      path: cardId ? `/pages/cardDetail/cardDetail?id=${cardId}&visitor=1` : '/pages/mycards/mycards',
    }
  },

  async setDefaultCard() {
    if (this.data.card && this.data.card.isDefault) {
      wx.showToast({ title: TEXT.defaultReady, icon: 'none' })
      return
    }
    try {
      await bootstrapSessionAsync()
      await setDefaultCardAsync(this.data.card.id)
      const nextCard = {
        ...this.data.card,
        isDefault: true
      }
      this.setData({ card: nextCard })
      if (app.globalData && app.globalData.cardData) {
        app.globalData.cardData = {
          ...app.globalData.cardData,
          isDefault: true
        }
      }
      wx.showToast({ title: TEXT.setDefaultDone, icon: 'success' })
    } catch (error) {
      console.error('set detail default failed:', error)
      wx.showToast({ title: TEXT.setDefaultFailed, icon: 'none' })
    }
  },

  previewQrcode() {
    const cardId = this.data.card && this.data.card.id ? this.data.card.id : ''
    wx.navigateTo({ url: `/pages/qrcode/qrcode?id=${cardId}` })
  },

  showMoreActions() {
    wx.showActionSheet({
      itemList: [TEXT.viewQr],
      success: () => {
        this.previewQrcode()
      }
    })
  },

  exchangeCard() {
    const cardId = this.data.card && this.data.card.id ? this.data.card.id : ''
    if (this.data.isVisitorMode && cardId) {
      wx.navigateTo({ url: '/pages/exchangeconfirm/exchangeconfirm?id=' + cardId })
      return
    }
    wx.navigateTo({ url: '/pages/exchange/exchange' + (cardId ? '?cardId=' + cardId : '') })
  }
})
